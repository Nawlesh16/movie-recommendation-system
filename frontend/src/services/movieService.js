// Calls OUR backend's /movies endpoints (backend/src/routes/movie.routes.js).
// The frontend never talks to TMDB directly - apiClient only knows our
// backend's URL, and the TMDB API key lives only on the backend.
import apiClient from './apiClient';

// GET /movies/trending -> movies[]
export async function getTrendingMovies() {
  const { data } = await apiClient.get('/movies/trending');
  return data.data.movies;
}

// GET /movies/popular -> movies[]
export async function getPopularMovies(page = 1) {
  const { data } = await apiClient.get('/movies/popular', { params: { page } });
  return data.data.movies;
}

// GET /movies/top-rated -> movies[]
export async function getTopRatedMovies(page = 1) {
  const { data } = await apiClient.get('/movies/top-rated', { params: { page } });
  return data.data.movies;
}

// GET /movies/search?query=... -> movies[]
export async function searchMovies(query, page = 1) {
  const { data } = await apiClient.get('/movies/search', { params: { query, page } });
  return data.data.movies;
}

// GET /movies/:id -> movie
export async function getMovieById(id) {
  const { data } = await apiClient.get(`/movies/${id}`);
  return data.data.movie;
}

// GET /graph/search?q=...&limit=10 -> Graph Search results
export async function searchGraphMovies(query, limit = 10) { 
  const { data } = await apiClient.get('/graph/search', { params: { q: query, limit } });
   console.log('Graph Search API response:', data); 
   return data.data; 
  }


  // Get user's interaction with a movie
export async function getMovieInteraction(tmdbId) {
  const { data } = await apiClient.get(`/interactions/${tmdbId}`);
  return data.data.interaction;
}

// Favorite
export async function addFavorite(tmdbId) {
  const { data } = await apiClient.post(`/interactions/${tmdbId}/favorite`);
  return data.data.interaction;
}

export async function removeFavorite(tmdbId) {
  const { data } = await apiClient.delete(`/interactions/${tmdbId}/favorite`);
  return data.data.interaction;
}

// Watchlist
export async function addToWatchlist(tmdbId) {
  const { data } = await apiClient.post(`/interactions/${tmdbId}/watchlist`);
  return data.data.interaction;
}

export async function removeFromWatchlist(tmdbId) {
  const { data } = await apiClient.delete(`/interactions/${tmdbId}/watchlist`);
  return data.data.interaction;
}

// User rating: 1–5 stars
export async function rateMovie(tmdbId, rating) {
  const { data } = await apiClient.post(
    `/interactions/${tmdbId}/rating`,
    { rating }
  );
  return data.data.interaction;
}

export async function removeMovieRating(tmdbId) {
  const { data } = await apiClient.delete(`/interactions/${tmdbId}/rating`);
  return data.data.interaction;
}

export async function getWatchlistMovies() {
  const { data } = await apiClient.get('/interactions/watchlist');
  return data.data;
}