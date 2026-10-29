import apiClient from "./apiClient";

export async function getRecommendations(limit = 12) {
  const { data } = await apiClient.get("/recommendations", { params: { limit } });
  return data.data;
}
export async function getBaselineRecommendations(limit = 12) {
  const { data } = await apiClient.get("/recommendations/baseline", { params: { limit } });
  return data.data;
}
export async function getSemanticRecommendations(limit = 12) {
  const { data } = await apiClient.get("/recommendations/semantic", { params: { limit } });
  return data.data;
}
export async function semanticSearchMovies(query, limit = 12) {
  const { data } = await apiClient.get("/movies/semantic-search", { params: { q: query, limit } });
  return data.data.movies;
}
export async function getSimilarMovies(tmdbId, limit = 12) {
  const { data } = await apiClient.get(`/movies/${tmdbId}/similar`, { params: { limit } });
  return data.data.movies;
}
