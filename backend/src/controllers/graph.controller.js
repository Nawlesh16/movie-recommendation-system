import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as graphRagService from "../services/graph-rag.service.js";
import * as graphService from "../services/graph.service.js";
import { getMovieDetails } from "../services/movie.service.js";
import { initializeNeo4j } from "../services/neo4j.service.js";

const limitSchema = z.coerce.number().int().min(1).max(50).default(12);

function getLimit(req) {
  const parsed = limitSchema.safeParse(req.query.limit);
  if (!parsed.success) throw new ApiError(400, "limit must be an integer between 1 and 50");
  return parsed.data;
}

function getQuery(req) {
  const query = String(req.query.q || "").trim();
  if (!query) throw new ApiError(400, "Graph search query is required");
  if (query.length > 200) throw new ApiError(400, "Graph search query is too long");
  return query;
}

export async function search(req, res) {
  try {
    const result = await graphRagService.graphSearch(getQuery(req), getLimit(req));
    const movies = result.movies.map((row) => ({
    ...row.movie,
    graphScore: row.graphScore,
    matchedGenres: row.matchedGenres,
    matchedActors: row.matchedActors,
    matchedDirectors: row.matchedDirectors,
    matchedKeywords: row.matchedKeywords,
    explanation: graphRagService.graphExplanation(row),
  }));
    sendSuccess(res, { message: "Graph search results fetched", data: { ...result, movies } });
  } catch (error) {
    console.error("GRAPH SEARCH ERROR:", error);
    if (error.code === "NEO4J_NOT_CONFIGURED" || error.name === "Neo4jError") {
      throw new ApiError(503, "Graph search is unavailable. Configure Neo4j and try again.");
    }
    throw error;
  }
}

export async function similar(req, res) {
  const tmdbId = Number(req.params.tmdbId);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) throw new ApiError(400, "Movie id must be a positive integer");
  let movies;
  try {
    movies = await graphService.getSimilarMoviesByGraph(tmdbId, getLimit(req));
  } catch (error) {
    if (error.code === "NEO4J_NOT_CONFIGURED" || error.name === "Neo4jError") {
      throw new ApiError(503, "Graph similarity is unavailable. Configure Neo4j and try again.");
    }
    throw error;
  }
  sendSuccess(res, {
    message: "Graph similar movies fetched",
    data: {
      movies: movies.map((row) => ({ ...row.movie, graphScore: row.graphScore, explanation: graphRagService.graphExplanation(row) })),
    },
  });
}

export async function sync(req, res) { 
  const tmdbId = Number(req.params.tmdbId); 
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) { 
  throw new ApiError(400, "Movie id must be a positive integer"); 
} 
try { 
  // Fetch movie details 
  const movie = await getMovieDetails(tmdbId); 
  // Actually save movie and relationships in Neo4j 
  const result = await graphService.syncMovieToGraph(movie);
  // Send actual sync result 
  sendSuccess(res, { message: "Movie synchronized to graph", data: result, }); 
  } 
  catch (error) { console.error("GRAPH SYNC ERROR:", error); 
    if ( error.code === "NEO4J_NOT_CONFIGURED" || error.name === "Neo4jError" ) { 
  throw new ApiError(503, "Movie graph synchronization failed"); 
        } 
  throw error; 
} 
 }

export async function initialize(req, res) {
  await initializeNeo4j();
  sendSuccess(res, { message: "Neo4j initialized", data: { initialized: true } });
}

export async function syncPopular(req, res) {
const count = Number(req.body?.count ?? 20);

if (!Number.isInteger(count) || count < 1 || count > 500) {
throw new ApiError(400, "Count must be an integer between 1 and 500");
}

const result = await graphService.syncPopularMoviesToGraph(count);

sendSuccess(res, {
message: "Bulk graph synchronization completed",
data: result,
});
}

export async function graphRag(req, res) {
  const query = getQuery(req);
  const limit = getLimit(req);

  const result = await graphRagService.graphRagAnswer(
    query,
    limit
  );

  return sendSuccess(res, {
    message: "Graph RAG answer generated",
    data: result,
  });
}