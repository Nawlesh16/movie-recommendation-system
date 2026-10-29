import { UserMovieInteraction } from "../models/UserMovieInteraction.js";
import { calculateUserPreferences } from "./preference.service.js";
import { getBaselineRecommendations, getSemanticRecommendations } from "./recommendation.service.js";
import * as graphService from "./graph.service.js";
import { explainRecommendations } from "./groq.service.js";
import { env } from "../config/env.js";

const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 0));
const movieId = (movie) => Number(movie?.tmdbId);

function normalizeWeights({ semanticAvailable, graphAvailable }) {
  const raw = {
    baseline: Math.max(0, env.baselineRecommendationWeight),
    semantic: semanticAvailable ? Math.max(0, env.semanticRecommendationWeight) : 0,
    graph: graphAvailable ? Math.max(0, env.graphRecommendationWeight) : 0,
  };
  const total = Object.values(raw).reduce((sum, value) => sum + value, 0);
  if (!total) return { baseline: 1, semantic: 0, graph: 0 };
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value / total]));
}

function buildEvidence(movie, preferences) {
  const evidence = [];
  const preferredGenres = Object.entries(preferences?.genres || {})
    .filter(([, score]) => score >= 0.4)
    .map(([genre]) => genre);
  const movieGenres = (movie.genres || []).map((genre) => genre?.name || genre).filter(Boolean);
  const sharedPreferredGenres = movieGenres.filter((genre) => preferredGenres.includes(genre));
  if (sharedPreferredGenres.length) evidence.push(`Matches your preference profile through the ${sharedPreferredGenres.join(", ")} genre${sharedPreferredGenres.length > 1 ? "s" : ""}`);
  if (movie.matchedGenres?.length) evidence.push(`Graph relationship verified: shared genre ${movie.matchedGenres.join(", ")}`);
  if (movie.matchedActors?.length) evidence.push(`Graph relationship verified: shared actor ${movie.matchedActors.join(", ")}`);
  if (movie.matchedDirectors?.length) evidence.push(`Graph relationship verified: same director ${movie.matchedDirectors.join(", ")}`);
  if (movie.matchedKeywords?.length) evidence.push(`Graph relationship verified: related keyword ${movie.matchedKeywords.join(", ")}`);
  if (movie.graphExplanation) evidence.push(movie.graphExplanation);
  if (Number(movie.semanticScore) > 0) evidence.push("Retrieved by semantic similarity to the user's movie preference profile");
  if (Number(movie.baselineScore) > 0) evidence.push("Ranked by the baseline score, which combines genre preference, language preference, movie rating, and popularity");
  if (!evidence.length && Number(movie.rating || 0) >= 7) evidence.push(`TMDB vote average is ${Number(movie.rating).toFixed(1)} out of 10`);
  return [...new Set(evidence)].slice(0, 5);
}

async function getGraphCandidates(userId, limit) {
  const interactions = await UserMovieInteraction.find({ user: userId })
    .sort({ rating: -1, updatedAt: -1 })
    .limit(40)
    .lean();

  // Watchlist-only and watched-without-a-positive-rating interactions are not
  // treated as evidence that the user likes a movie.
  const seeds = interactions.filter((item) => item.isFavorite || Number(item.rating) >= 4 || (item.isWatched && Number(item.rating) >= 3)).slice(0, 6);
  if (!seeds.length) return [];

  const excluded = new Set(interactions.map((item) => Number(item.tmdbId)));
  const sets = await Promise.all(seeds.map((item) =>
    graphService.getSimilarMoviesByGraph(Number(item.tmdbId), Math.max(8, Math.ceil(limit / 2)))
      .catch((error) => {
        console.warn(`Graph candidates unavailable for movie ${item.tmdbId}: ${error.message}`);
        return [];
      })
  ));

  const map = new Map();
  for (const rows of sets) {
    for (const row of rows) {
      const id = movieId(row.movie);
      if (!id || excluded.has(id)) continue;
      const current = map.get(id) || { ...row.movie, graphScore: 0, graphExplanations: [], matchedGenres: [], matchedActors: [], matchedDirectors: [], matchedKeywords: [] };
      current.graphScore = Math.max(current.graphScore, clamp01(Number(row.graphScore || 0) / 3));
      if (row.explanation) current.graphExplanations.push(row.explanation);
      for (const key of ["matchedGenres", "matchedActors", "matchedDirectors", "matchedKeywords"]) {
        current[key] = [...new Set([...(current[key] || []), ...(row[key] || [])])];
      }
      map.set(id, current);
    }
  }
  return [...map.values()].sort((a, b) => b.graphScore - a.graphScore).slice(0, limit);
}

function fallbackExplanation(movie) {
  const evidence = movie.recommendationEvidence || [];
  if (evidence.length) return `${evidence[0]}.`;
  return "A popular movie selected to help you discover recommendations; rate or favorite movies to personalize this list.";
}

export async function getHybridGraphRecommendations(userId, limit = 12) {
  const candidateLimit = Math.min(100, Math.max(limit * 3, 24));
  const [baseline, semanticResult, graphResult] = await Promise.all([
    getBaselineRecommendations(userId, candidateLimit),
    getSemanticRecommendations(userId, candidateLimit).catch((error) => {
      console.warn("Semantic recommendation source unavailable:", error.message);
      return { movies: [], preferences: null, personalized: false, sourceError: true };
    }),
    getGraphCandidates(userId, candidateLimit).catch((error) => {
      console.warn("Graph recommendation source unavailable:", error.message);
      return [];
    }),
  ]);

  const preferences = baseline.preferences || semanticResult.preferences || await calculateUserPreferences(userId);
  if (!baseline.personalized) {
    const uniqueMovies = new Map();

    for (const movie of baseline.movies || []) {
      const id = movieId(movie);
      if (!id || uniqueMovies.has(id)) continue;

      uniqueMovies.set(id, {
        ...movie,
        recommendationReason:
          "Popular starting point; rate or favorite movies to personalize your recommendations.",
      });
    }

    const movies = [...uniqueMovies.values()].slice(0, limit);

    return {
      personalized: false,
      preferences,
      fallback: "popular",
      sourceAvailability: {
        baseline: true,
        semantic: !semanticResult.sourceError && semanticResult.movies.length > 0,
        graph: graphResult.length > 0,
        groq: false,
      },
      weights: {
        baseline: 1,
        semantic: 0,
        graph: 0,
      },
      movies,
    };
  }
  const semanticAvailable = !semanticResult.sourceError && semanticResult.movies.length > 0;
  const graphAvailable = graphResult.length > 0;
  const weights = normalizeWeights({ semanticAvailable, graphAvailable });
  const combined = new Map();
  const merge = (movie, source, score) => {
    const id = movieId(movie);
    if (!id) return;
    const current = combined.get(id) || {
      ...movie,
      baselineScore: 0,
      semanticScore: 0,
      graphScore: 0,
      graphExplanations: [],
      matchedGenres: [],
      matchedActors: [],
      matchedDirectors: [],
      matchedKeywords: [],
    };
    current[source] = clamp01(score);
    // Keep any richer cached metadata when another retrieval source only has a payload.
    for (const field of ["title", "overview", "posterPath", "backdropPath", "releaseDate", "genres", "originalLanguage", "rating", "popularity"]) {
      if ((current[field] == null || current[field] === "" || (Array.isArray(current[field]) && !current[field].length)) && movie[field] != null) current[field] = movie[field];
    }
    if (movie.graphExplanation) current.graphExplanations = [...new Set([...current.graphExplanations, movie.graphExplanation])];
    if (movie.graphExplanations) current.graphExplanations = [...new Set([...current.graphExplanations, ...movie.graphExplanations])];
    for (const field of ["matchedGenres", "matchedActors", "matchedDirectors", "matchedKeywords"]) {
      current[field] = [...new Set([...(current[field] || []), ...(movie[field] || [])])];
    }
    combined.set(id, current);
  };

  baseline.movies.forEach((movie) => merge(movie, "baselineScore", movie.recommendationScore));
  semanticResult.movies.forEach((movie) => merge(movie, "semanticScore", movie.semanticScore));
  graphResult.forEach((movie) => merge(movie, "graphScore", movie.graphScore));

  const ranked = [...combined.values()].map((movie) => {
    movie.graphExplanation = movie.graphExplanations?.[0] || null;
    movie.recommendationEvidence = buildEvidence(movie, preferences);
    movie.hybridScore = Number((
      weights.baseline * clamp01(movie.baselineScore) +
      weights.semantic * clamp01(movie.semanticScore) +
      weights.graph * clamp01(movie.graphScore)
    ).toFixed(6));
    movie.recommendationReason = fallbackExplanation(movie);
    return movie;
  }).sort((a, b) => b.hybridScore - a.hybridScore).slice(0, limit);

  // One optional batched LLM request for the final list. The ranking is already
  // complete and remains available if Groq is not configured or fails.
  const explained = await explainRecommendations(ranked);
  const movies = explained.movies.map(({ recommendationEvidence, graphExplanations, ...movie }) => ({
    ...movie,
    recommendationReason: movie.explanation || movie.recommendationReason || fallbackExplanation(movie),
  }));

  return {
    personalized: true,
    sourceAvailability: {
      baseline: true,
      semantic: semanticAvailable,
      graph: graphAvailable,
      groq: explained.groqAvailable,
    },
    weights,
    preferences,
    movies,
  };
}
