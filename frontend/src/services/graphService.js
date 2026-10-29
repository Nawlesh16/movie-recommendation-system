import apiClient from './apiClient';

export async function graphSearchMovies(query, limit = 12) {
  const { data } = await apiClient.get('/graph/search', { params: { q: query, limit } });
  return data.data;
}

export async function getGraphSimilarMovies(tmdbId, limit = 12) {
  const { data } = await apiClient.get(`/graph/similar/${tmdbId}`, { params: { limit } });
  return data.data.movies;
}

export async function syncMovieToGraph(tmdbId) {
  const { data } = await apiClient.post(`/graph/sync/${tmdbId}`);
  return data.data;
}
