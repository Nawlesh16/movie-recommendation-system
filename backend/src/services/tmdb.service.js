// ALL direct communication with TMDB lives here, and ONLY here.
// Controllers and other services never import axios or know TMDB's URL shape;
// they call the functions below and get back plain TMDB JSON (or a thrown ApiError).
import axios from "axios";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const tmdbClient = axios.create({
  baseURL: env.tmdbBaseUrl,
  timeout: 60000, // TMDB is usually fast; fail fast rather than hang the request
});

// Every TMDB v3 request needs the API key as a query param.
// This interceptor adds it automatically so no call site has to remember to.
tmdbClient.interceptors.request.use((config) => {
  config.params = { api_key: env.tmdbApiKey, language: "en-US", ...config.params };
  return config;
});

// Turns any TMDB/network failure into an ApiError with a SAFE message.
// The real TMDB error body (which could echo back query params) is logged,
// never sent to the client, so the API key can never leak through a response.
function handleTmdbError(error, context) {
  if (error.code === "ECONNABORTED") {
    console.error(`TMDB timeout during ${context}`);
    throw new ApiError(504, "The movie database took too long to respond. Please try again.");
  }

  if (error.response) {
    console.error(`TMDB error during ${context}:`, error.response.status, error.response.data);
    if (error.response.status === 404) {
      throw new ApiError(404, "Movie not found");
    }
    if (error.response.status === 401) {
      // This means OUR api key is wrong/missing - a server misconfiguration, not the caller's fault.
      throw new ApiError(500, "Movie service is misconfigured. Please contact support.");
    }
    throw new ApiError(502, "The movie database returned an error. Please try again later.");
  }

  console.error(`TMDB network error during ${context}:`, error.message);
  throw new ApiError(502, "Could not reach the movie database. Please try again later.");
}

export async function getTrendingMovies() {
  try {
    const { data } = await tmdbClient.get("/trending/movie/day");
    return data.results;
  } catch (error) {
    handleTmdbError(error, "getTrendingMovies");
  }
}

export async function getPopularMovies(page = 1) {
  try {
    const { data } = await tmdbClient.get("/movie/popular", { params: { page } });
    return data.results;
  } catch (error) {
    handleTmdbError(error, "getPopularMovies");
  }
}

export async function getTopRatedMovies(page = 1) {
  try {
    const { data } = await tmdbClient.get("/movie/top_rated", { params: { page } });
    return data.results;
  } catch (error) {
    handleTmdbError(error, "getTopRatedMovies");
  }
}

export async function searchMovies(query, page = 1) {
  try {
    const { data } = await tmdbClient.get("/search/movie", { params: { query, page } });
    return data.results;
  } catch (error) {
    handleTmdbError(error, "searchMovies");
  }
}

// append_to_response=credits gets the cast in the SAME request, instead of a second call.
export async function getMovieDetails(tmdbId) {
  try {
    const { data } = await tmdbClient.get(`/movie/${tmdbId}`, {
      params: { append_to_response: "credits" },
    });
    return data;
  } catch (error) {
    handleTmdbError(error, "getMovieDetails");
  }
}
