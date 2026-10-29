// Thin HTTP layer: read the (already-validated) request, call movie.service,
// send the response. No TMDB or MongoDB calls happen in this file.
import * as movieService from "../services/movie.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function getTrending(req, res) {
  const movies = await movieService.getTrendingMovies();
  sendSuccess(res, { message: "Trending movies fetched successfully", data: { movies } });
}

export async function getPopular(req, res) {
  const page = Number(req.query.page) || 1;
  const movies = await movieService.getPopularMovies(page);
  sendSuccess(res, { message: "Popular movies fetched successfully", data: { movies } });
}

export async function getTopRated(req, res) {
  const page = Number(req.query.page) || 1;
  const movies = await movieService.getTopRatedMovies(page);
  sendSuccess(res, { message: "Top rated movies fetched successfully", data: { movies } });
}

export async function search(req, res) {
  const { query } = req.query; // validated + trimmed by validateQuery(searchQuerySchema)
  const page = Number(req.query.page) || 1;
  const movies = await movieService.searchMovies(query, page);
  sendSuccess(res, { message: "Search results fetched successfully", data: { movies } });
}

export async function getById(req, res) {
  const { id } = req.params; // validated + converted to a Number by validateParams(movieIdParamSchema)
  const movie = await movieService.getMovieDetails(id);
  sendSuccess(res, { message: "Movie details fetched successfully", data: { movie } });
}

export async function semanticSearch(req, res) {
  const { q } = req.query;
  const limit = Number(req.query.limit) || 12;

  const movies = await movieService.semanticSearchMovies(q, limit);

  sendSuccess(res, {
    message: "Semantic search results fetched successfully",
    data: {
      query: q,
      count: movies.length,
      movies,
    },
  });
}

export async function syncMovieVectors(req, res) {
  const pages = Number.parseInt(req.body?.pages, 10) || 1;

  const result = await movieService.syncMovieVectors({ pages });

  sendSuccess(res, {
    message: "Movie vector synchronization completed",
    data: result,
  });
}
