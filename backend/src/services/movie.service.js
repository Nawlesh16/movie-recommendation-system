// Business logic for the movie feature: turns raw TMDB shapes into OUR shape,
// and decides when to read/write MongoDB. Controllers call these functions and
// never talk to TMDB or Mongoose directly.
import * as tmdbService from "./tmdb.service.js";
import { Movie } from "../models/Movie.js";
import { generateEmbedding } from "./embedding.service.js";
import { searchMovieVectors,upsertMovieVector, } from "./qdrant.service.js";
import { createHash } from "node:crypto";

// A cached movie is reused as-is if it was fetched within this window;
// otherwise we refresh it from TMDB. 7 days is plenty for a rating/popularity
// number that changes slowly, and keeps this phase's caching rule simple.
const CACHE_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;

function toDateOrNull(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Shape used for lists (trending/popular/top-rated/search): light, and NOT
// written to the database - TMDB's list endpoints don't include genre names,
// runtime or cast, so there's nothing worth caching per-item on every request.
function toMovieSummary(tmdbMovie) {
  return {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    originalTitle: tmdbMovie.original_title,
    overview: tmdbMovie.overview,
    posterPath: tmdbMovie.poster_path,
    backdropPath: tmdbMovie.backdrop_path,
    releaseDate: toDateOrNull(tmdbMovie.release_date),
    rating: tmdbMovie.vote_average,
    voteCount: tmdbMovie.vote_count,
    popularity: tmdbMovie.popularity,
    genreIds: tmdbMovie.genre_ids || [],
    originalLanguage: tmdbMovie.original_language,
    adult: Boolean(tmdbMovie.adult),
  };
}

// Full shape used for the movie details page. Includes everything toMovieSummary
// has, plus genres (with names), runtime, and a short cast list - only available
// from the /movie/{id} endpoint, which is why this is a separate function.
function toMovieDetails(tmdbMovie) {
  return {
    ...toMovieSummary(tmdbMovie),
    genres: (tmdbMovie.genres || []).map((g) => ({ id: g.id, name: g.name })),
    runtime: tmdbMovie.runtime ?? null,
    cast: (tmdbMovie.credits?.cast || []).slice(0, 10).map((member) => ({
      id: member.id,
      name: member.name,
      character: member.character,
      profilePath: member.profile_path,
    })),
  };
}

export async function getTrendingMovies() {
  const results = await tmdbService.getTrendingMovies();
  return results.map(toMovieSummary);
}

export async function getPopularMovies(page) {
  const results = await tmdbService.getPopularMovies(page);
  return results.map(toMovieSummary);
}

export async function getTopRatedMovies(page) {
  const results = await tmdbService.getTopRatedMovies(page);
  return results.map(toMovieSummary);
}

export async function searchMovies(query, page) {
  const results = await tmdbService.searchMovies(query, page);
  return results.map(toMovieSummary);
}

// Check MongoDB first; only call TMDB if we've never seen this movie, or our
// copy is older than CACHE_FRESHNESS_MS. Either way, the caller always gets
// back a Movie document with the same shape.
export async function getMovieDetails(tmdbId) {
  const cached = await Movie.findOne({ tmdbId });
  const isFresh = cached && Date.now() - cached.updatedAt.getTime() < CACHE_FRESHNESS_MS;

  if (isFresh) {
    return cached;
  }

  const tmdbMovie = await tmdbService.getMovieDetails(tmdbId);
  const normalized = toMovieDetails(tmdbMovie);

  // upsert: create it if it's new, update it in place if we already had a stale copy.
  const movie = await Movie.findOneAndUpdate(
    { tmdbId },
    { $set: normalized },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
 return movie;
}

function buildMovieEmbeddingText(movie) {
  const genres = (movie.genres || [])
    .map((genre) => genre.name || genre)
    .filter(Boolean)
    .join(", ");

  return [
    `Title: ${movie.title || ""}`,
    `Overview: ${movie.overview || ""}`,
    `Genres: ${genres}`,
    `Language: ${movie.originalLanguage || ""}`,
    `Director: ${movie.director || ""}`,
    `Keywords: ${(movie.keywords || []).join(", ")}`,
  ].join("\n");
}
export async function semanticSearchMovies(query, limit = 12) {
  const normalizedQuery = String(query || "").trim();

  if (!normalizedQuery) {
    throw new Error("Search query is required");
  }

  const safeLimit = Math.min(
    Math.max(Number.parseInt(limit, 10) || 12, 1),
    50
  );

  // Convert the user's query into an embedding vector.
  const vector = await generateEmbedding(normalizedQuery);

  // Search for semantically similar movie vectors in Qdrant.
  const points = await searchMovieVectors(vector, {
    limit: safeLimit,
  });

  // Return movie data along with similarity scores.
  return points.map((point) => ({
    ...(point.payload || {}),
    tmdbId: point.payload?.tmdbId ?? point.id,
    similarityScore: point.score ?? null,
  }));
}

export async function syncMovieVectors({ pages = 1 } = {}) {
  const safePages = Math.min(
    Math.max(Number.parseInt(pages, 10) || 1, 1),
    5
  );

  let synced = 0;
  let failed = 0;
  const errors = [];

  for (let page = 1; page <= safePages; page++) {
    let movies;

    try {
      movies = await tmdbService.getPopularMovies(page);
    } catch (error) {
      errors.push({
        page,
        error: error.message,
      });
      failed++;
      continue;
    }

    for (const item of movies) {
      try {
        // Full movie details provide genre names and overview.
        const movie = await getMovieDetails(item.id);

        const embeddingText = buildMovieEmbeddingText(movie);
        const vector = await generateEmbedding(embeddingText);

        const contentHash = createHash("sha256")
          .update(embeddingText)
          .digest("hex");

        await upsertMovieVector(
          {
            tmdbId: movie.tmdbId,
            title: movie.title,
            overview: movie.overview,
            genres: movie.genres,
            originalLanguage: movie.originalLanguage,
            releaseDate: movie.releaseDate,
            rating: movie.rating,
            popularity: movie.popularity,
            posterPath: movie.posterPath,
            backdropPath: movie.backdropPath,
            director: movie.director,
            keywords: movie.keywords,
          },
          vector,
          contentHash
        );

        synced++;
      } catch (error) {
  failed++;

  const errorDetails = {
    message: error.message,
    status: error.status || error.response?.status,
    data: error.data || error.response?.data,
    details: error.response?.data?.status?.error,
  };

  errors.push({
    tmdbId: item.id,
    title: item.title,
    error: errorDetails,
  });

  console.error(
    `Failed to sync movie ${item.id} (${item.title}):`,
    JSON.stringify(errorDetails, null, 2)
  );
}
    }
  }

  return {
    requestedPages: safePages,
    synced,
    failed,
    errors: errors.slice(0, 20),
  };
}