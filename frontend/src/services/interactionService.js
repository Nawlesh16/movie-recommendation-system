import apiClient from "./apiClient";

export async function getInteraction(tmdbId) {
  const { data } = await apiClient.get(`/interactions/${tmdbId}`);
  return data.data.interaction;
}

export async function setRating(tmdbId, rating) {
  const { data } = await apiClient.post(`/interactions/${tmdbId}/rating`, { rating });
  return data.data.interaction;
}
export async function removeRating(tmdbId) {
  const { data } = await apiClient.delete(`/interactions/${tmdbId}/rating`);
  return data.data.interaction;
}
export async function addFavorite(tmdbId) {
  const { data } = await apiClient.post(`/interactions/${tmdbId}/favorite`);
  return data.data.interaction;
}
export async function removeFavorite(tmdbId) {
  const { data } = await apiClient.delete(`/interactions/${tmdbId}/favorite`);
  return data.data.interaction;
}
export async function addWatchlist(tmdbId) {
  const { data } = await apiClient.post(`/interactions/${tmdbId}/watchlist`);
  return data.data.interaction;
}
export async function removeWatchlist(tmdbId) {
  const { data } = await apiClient.delete(`/interactions/${tmdbId}/watchlist`);
  return data.data.interaction;
}
export async function markWatched(tmdbId) {
  const { data } = await apiClient.post(`/interactions/${tmdbId}/watched`);
  return data.data.interaction;
}
export async function unmarkWatched(tmdbId) {
  const { data } = await apiClient.delete(`/interactions/${tmdbId}/watched`);
  return data.data.interaction;
}

async function list(path) {
  const { data } = await apiClient.get(path);
  return data.data.interactions || [];
}
export const getFavorites = () => list("/interactions/favorites");
export const getWatchlist = () => list("/interactions/watchlist");
export const getWatched = () => list("/interactions/watched");
export const getRatings = () => list("/interactions/ratings");
