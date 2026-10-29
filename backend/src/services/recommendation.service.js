import { Movie } from "../models/Movie.js";
import { getPopularMovies } from "./movie.service.js";
import { UserMovieInteraction } from "../models/UserMovieInteraction.js";
import { calculateUserPreferences, buildPreferenceText } from "./preference.service.js";
import { generateEmbedding } from "./embedding.service.js";
import { searchMovieVectors } from "./qdrant.service.js";
import { env } from "../config/env.js";
import { buildMovieEmbeddingText } from "./movieEmbeddingText.service.js";

const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

function genrePreferenceScore(movie, preferences) {
  const names = (movie.genres || []).map((g) => g.name || g).filter(Boolean);
  if (!names.length) return 0;
  return names.reduce((sum, name) => sum + (preferences.genres[name] || 0), 0) / names.length;
}

function languagePreferenceScore(movie, preferences) {
  return preferences.languages[movie.originalLanguage] || 0;
}

function qualityScore(movie) {
  return clamp01((movie.rating || 0) / 10);
}

function popularityScore(movie, maxPopularity) {
  if (!maxPopularity) return 0;
  return clamp01((movie.popularity || 0) / maxPopularity);
}

function baselineScore(movie, preferences, maxPopularity) {
  const genre = genrePreferenceScore(movie, preferences);
  const quality = qualityScore(movie);
  const popularity = popularityScore(movie, maxPopularity);
  const language = languagePreferenceScore(movie, preferences);
  // Explainable deterministic formula; all components are already 0..1.
  return Number((0.45 * genre + 0.25 * quality + 0.15 * popularity + 0.15 * language).toFixed(6));
}

async function getCandidateMovies(limit = 60) {
  return Movie.find({ adult: { $ne: true } }).sort({ popularity: -1, rating: -1 }).limit(limit).lean();
}

export async function getBaselineRecommendations(userId, limit = 12) {
  const preferences = await calculateUserPreferences(userId);
  if (!preferences.interactionCount) {
    let movies = await getCandidateMovies(limit);
    if (movies.length < limit) {
      try {
        const popular = await getPopularMovies(1);
        movies = popular.slice(0, limit);
      } catch (error) {
        console.warn("Popular fallback unavailable:", error.message);
      }
    }
    return { personalized: false, preferences, movies };
  }

  const interactions = await UserMovieInteraction.find({ user: userId }).lean();
  const excluded = new Set(interactions.map((item) => item.tmdbId));
  let candidates = (await getCandidateMovies(80)).filter((movie) => !excluded.has(movie.tmdbId));
  if (candidates.length < limit) {
    try {
      const popular = await getPopularMovies(1);
      const byId = new Map(candidates.map((movie) => [movie.tmdbId, movie]));
      popular.forEach((movie) => { if (!excluded.has(movie.tmdbId) && !byId.has(movie.tmdbId)) byId.set(movie.tmdbId, movie); });
      candidates = [...byId.values()];
    } catch (error) {
      console.warn("Popular candidate expansion unavailable:", error.message);
    }
  }

  const maxPopularity = Math.max(...candidates.map((m) => m.popularity || 0), 1);
  const movies = candidates
    .map((movie) => ({ ...movie, recommendationScore: baselineScore(movie, preferences, maxPopularity) }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);

  return { personalized: true, preferences, movies };
}

export async function getSemanticRecommendations(userId, limit = 12) {
  const preferences = await calculateUserPreferences(userId);
  if (!preferences.interactionCount) {
    return { personalized: false, preferences, movies: [] };
  }

  const interactions = await UserMovieInteraction.find({
    user: userId,
    $or: [{ rating: { $gte: 3 } }, { isFavorite: true }, { isWatched: true }],
  }).sort({ updatedAt: -1 }).limit(10).lean();
  const ids = interactions.map((item) => item.tmdbId);
  const representativeMovies = ids.length ? await Movie.find({ tmdbId: { $in: ids } }).lean() : [];
  const queryText = buildPreferenceText(preferences, representativeMovies);
  const vector = await generateEmbedding(queryText);
  const results = await searchMovieVectors(vector, { limit: Math.max(limit * 2, 20) });
  const excluded = new Set(ids);

  const movies = results
    .filter((result) => result.payload?.tmdbId && !excluded.has(Number(result.payload.tmdbId)))
    .slice(0, limit)
    .map((result) => ({
      ...result.payload,
      tmdbId: Number(result.payload.tmdbId),
      semanticScore: clamp01((Number(result.score) + 1) / 2),
    }));

  return { personalized: true, preferences, movies };
}

export async function getHybridRecommendations(userId, limit = 12) {
  const [baseline, semantic] = await Promise.all([
    getBaselineRecommendations(userId, Math.max(limit * 2, 20)),
    getSemanticRecommendations(userId, Math.max(limit * 2, 20)).catch((error) => {
      console.warn("Semantic recommendation branch unavailable:", error.message);
      return { personalized: true, preferences: null, movies: [] };
    }),
  ]);

  if (!baseline.personalized) return { ...baseline, semanticAvailable: false };

  const baselineWeight = Math.max(0, env.baselineRecommendationWeight);
  const semanticWeight = Math.max(0, env.semanticRecommendationWeight);
  const totalWeight = baselineWeight + semanticWeight || 1;
  const bw = baselineWeight / totalWeight;
  const sw = semanticWeight / totalWeight;

  const combined = new Map();
  baseline.movies.forEach((movie) => {
    combined.set(movie.tmdbId, {
      ...movie,
      baselineScore: movie.recommendationScore || 0,
      semanticScore: 0,
    });
  });
  semantic.movies.forEach((movie) => {
    const current = combined.get(movie.tmdbId) || { ...movie, baselineScore: 0 };
    current.semanticScore = movie.semanticScore || 0;
    combined.set(movie.tmdbId, current);
  });

  const movies = [...combined.values()]
    .map((movie) => ({
      ...movie,
      hybridScore: Number((bw * clamp01(movie.baselineScore) + sw * clamp01(movie.semanticScore)).toFixed(6)),
    }))
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, limit);

  return {
    personalized: true,
    semanticAvailable: semantic.movies.length > 0,
    weights: { baseline: bw, semantic: sw },
    preferences: baseline.preferences,
    movies,
  };
}

export async function getSemanticSearch(query, limit = 12) {
  const vector = await generateEmbedding(query);
  const results = await searchMovieVectors(vector, { limit });
  return results.map((result) => ({
    ...result.payload,
    tmdbId: Number(result.payload.tmdbId),
    semanticScore: Number(result.score),
  }));
}

export async function getSimilarMovies(tmdbId, limit = 12) {
  const vectorResult = await (await import("./qdrant.service.js")).getMovieVector(tmdbId);
  if (!vectorResult?.vector) return [];
  const vector = Array.isArray(vectorResult.vector) ? vectorResult.vector : vectorResult.vector?.default;
  if (!Array.isArray(vector)) return [];
  const results = await searchMovieVectors(vector, { limit: limit + 1, excludeTmdbId: tmdbId });
  return results.slice(0, limit).map((result) => ({
    ...result.payload,
    tmdbId: Number(result.payload.tmdbId),
    semanticScore: Number(result.score),
  }));
}

export function getEmbeddingPreview(movie) {
  return buildMovieEmbeddingText(movie);
}
