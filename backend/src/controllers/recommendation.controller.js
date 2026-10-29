import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import * as recommendationService from "../services/recommendation.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as graphHybridService from "../services/graph-hybrid.service.js";

const limitSchema = z.coerce.number().int().min(1).max(50).default(12);

function getLimit(req) {
  const parsed = limitSchema.safeParse(req.query.limit);
  if (!parsed.success) throw new ApiError(400, "limit must be an integer between 1 and 50");
  return parsed.data;
}

export async function baseline(req, res) {
  const result = await recommendationService.getBaselineRecommendations(req.user.id, getLimit(req));
  sendSuccess(res, { message: "Baseline recommendations fetched", data: result });
}

export async function semantic(req, res) {
  const result = await recommendationService.getSemanticRecommendations(req.user.id, getLimit(req));
  sendSuccess(res, { message: "Semantic recommendations fetched", data: result });
}

export async function hybrid(req, res) {
  const result = await graphHybridService.getHybridGraphRecommendations(
    req.user.id,
    getLimit(req)
  );

  sendSuccess(res, {
    message: "Recommendations fetched",
    data: result,
  });
}

export async function semanticSearch(req, res) {
  const query = String(req.query.q || "").trim();
  if (!query) throw new ApiError(400, "Search query is required");
  if (query.length > 200) throw new ApiError(400, "Search query is too long");
  const movies = await recommendationService.getSemanticSearch(query, getLimit(req));
  sendSuccess(res, { message: "Semantic search results fetched", data: { movies } });
}

export async function similar(req, res) {
  const id = Number(req.params.tmdbId);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Movie id must be a positive integer");
  const movies = await recommendationService.getSimilarMovies(id, getLimit(req));
  sendSuccess(res, { message: "Similar movies fetched", data: { movies } });
}
