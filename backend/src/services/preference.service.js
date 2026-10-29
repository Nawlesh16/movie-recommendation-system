import { UserMovieInteraction } from "../models/UserMovieInteraction.js";
import { Movie } from "../models/Movie.js";

function addWeight(map, key, weight) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + weight);
}

function normalizeMap(map, confidence = 1) {
  const values = [...map.values()];
  const max = Math.max(...values, 0);
  return Object.fromEntries([...map.entries()].map(([key, value]) => [key, max ? Number(((value / max) * confidence).toFixed(4)) : 0]));
}

export async function calculateUserPreferences(userId) {
  const interactions = await UserMovieInteraction.find({ user: userId }).lean();
  const ids = interactions.map((item) => item.tmdbId);
  const movies = ids.length ? await Movie.find({ tmdbId: { $in: ids } }).lean() : [];
  const movieById = new Map(movies.map((movie) => [movie.tmdbId, movie]));

  const genreWeights = new Map();
  const languageWeights = new Map();
  let ratingTotal = 0;
  let ratingCount = 0;
  let favoriteCount = 0;
  let watchedCount = 0;
  let watchlistCount = 0;
  let meaningfulInteractionCount = 0;

  for (const interaction of interactions) {
    const movie = movieById.get(interaction.tmdbId);
    if (!movie) continue;

    // A watchlist-only entry expresses intent to watch, not a positive taste signal.
    const ratingWeight = interaction.rating ? Math.max(0, (interaction.rating - 2) / 3) : 0;
    const favoriteWeight = interaction.isFavorite ? 1.25 : 0;
    const watchedWeight = interaction.isWatched ? 0.2 : 0;
    const totalWeight = ratingWeight + favoriteWeight + watchedWeight;
    if (interaction.isWatchlisted) watchlistCount += 1;
    if (interaction.rating != null || interaction.isFavorite || interaction.isWatched) meaningfulInteractionCount += 1;
    if (interaction.rating != null) {
      ratingTotal += interaction.rating;
      ratingCount += 1;
    }
    if (interaction.isFavorite) favoriteCount += 1;
    if (interaction.isWatched) watchedCount += 1;
    if (!totalWeight) continue;
    for (const genre of movie.genres || []) {
      addWeight(genreWeights, genre.name || String(genre.id), totalWeight || 0.1);
    }
    addWeight(languageWeights, movie.originalLanguage, totalWeight || 0.1);
  }

  // Shrink preference weights until the user has multiple meaningful signals.
  // This prevents one weak rating from becoming a falsely certain 1.0 preference.
  const confidence = Math.min(1, meaningfulInteractionCount / 3);

  return {
    interactionCount: meaningfulInteractionCount,
    preferenceConfidence: Number(confidence.toFixed(4)),
    totalInteractionCount: interactions.length,
    watchlistCount,
    ratedCount: ratingCount,
    favoriteCount,
    watchedCount,
    averageRating: ratingCount ? Number((ratingTotal / ratingCount).toFixed(2)) : null,
    genres: normalizeMap(genreWeights, confidence),
    languages: normalizeMap(languageWeights, confidence),
  };
}

export function buildPreferenceText(preferences, movies = []) {
  const genres = Object.entries(preferences.genres)
    .sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name]) => name);
  const languages = Object.entries(preferences.languages)
    .sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name]) => name);
  const movieContext = movies.slice(0, 5).map((movie) => `${movie.title}: ${movie.overview || ""}`).join("\n");

  return [
    `Movie taste profile.`,
    `Preferred genres: ${genres.join(", ") || "unknown"}.`,
    `Preferred languages: ${languages.join(", ") || "unknown"}.`,
    `Average user rating: ${preferences.averageRating ?? "unknown"}.`,
    `Watchlist entries are not treated as positive preference evidence.`,
    `Representative movies:\n${movieContext || "none yet"}`,
  ].join("\n");
}
