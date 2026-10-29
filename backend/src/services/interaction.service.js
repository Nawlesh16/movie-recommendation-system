import { UserMovieInteraction } from "../models/UserMovieInteraction.js";
import { Movie } from "../models/Movie.js";
import { ApiError } from "../utils/ApiError.js";

function normalizeTmdbId(tmdbId) {
  const id = Number(tmdbId);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Movie id must be a positive integer");
  return id;
}

async function getOrCreate(userId, tmdbId) {
  return UserMovieInteraction.findOneAndUpdate(
    { user: userId, tmdbId },
    { $setOnInsert: { user: userId, tmdbId } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

async function cleanupIfEmpty(interaction) {
  if (!interaction) return;
  if (!interaction.rating && !interaction.isFavorite && !interaction.isWatchlisted && !interaction.isWatched) {
    await UserMovieInteraction.deleteOne({ _id: interaction._id });
  }
}

export async function setRating(userId, tmdbId, rating) {
  const id = normalizeTmdbId(tmdbId);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be an integer from 1 to 5");
  }
  const interaction = await getOrCreate(userId, id);
  interaction.rating = rating;
  await interaction.save();
  return interaction;
}

export async function removeRating(userId, tmdbId) {
  const id = normalizeTmdbId(tmdbId);
  const interaction = await UserMovieInteraction.findOne({ user: userId, tmdbId: id });
  if (!interaction) return null;
  interaction.rating = null;
  await interaction.save();
  await cleanupIfEmpty(interaction);
  return interaction;
}

async function setFlag(userId, tmdbId, field, value) {
  const id = normalizeTmdbId(tmdbId);
  const interaction = await getOrCreate(userId, id);
  interaction[field] = value;
  await interaction.save();
  if (!value) await cleanupIfEmpty(interaction);
  return interaction;
}

export const addFavorite = (userId, tmdbId) => setFlag(userId, tmdbId, "isFavorite", true);
export const removeFavorite = (userId, tmdbId) => setFlag(userId, tmdbId, "isFavorite", false);
export const addWatchlist = (userId, tmdbId) => setFlag(userId, tmdbId, "isWatchlisted", true);
export const removeWatchlist = (userId, tmdbId) => setFlag(userId, tmdbId, "isWatchlisted", false);
export const markWatched = (userId, tmdbId) => setFlag(userId, tmdbId, "isWatched", true);
export const unmarkWatched = (userId, tmdbId) => setFlag(userId, tmdbId, "isWatched", false);

export async function getInteraction(userId, tmdbId) {
  const id = normalizeTmdbId(tmdbId);
  return UserMovieInteraction.findOne({ user: userId, tmdbId: id }).lean();
}

async function listInteractions(userId, field) {
  const filter = { user: userId, [field]: true };
  const interactions = await UserMovieInteraction.find(filter).sort({ updatedAt: -1 }).lean();
  const ids = interactions.map((item) => item.tmdbId);
  const movies = await Movie.find({ tmdbId: { $in: ids } }).lean();
  const byId = new Map(movies.map((movie) => [movie.tmdbId, movie]));
  return interactions.map((interaction) => ({ ...interaction, movie: byId.get(interaction.tmdbId) || null }));
}

export const listFavorites = (userId) => listInteractions(userId, "isFavorite");
export const listWatchlist = (userId) => listInteractions(userId, "isWatchlisted");
export const listWatched = (userId) => listInteractions(userId, "isWatched");
export const listRatings = async (userId) => {
  const interactions = await UserMovieInteraction.find({ user: userId, rating: { $ne: null } }).sort({ updatedAt: -1 }).lean();
  const ids = interactions.map((item) => item.tmdbId);
  const movies = await Movie.find({ tmdbId: { $in: ids } }).lean();
  const byId = new Map(movies.map((movie) => [movie.tmdbId, movie]));
  return interactions.map((interaction) => ({ ...interaction, movie: byId.get(interaction.tmdbId) || null }));
};
