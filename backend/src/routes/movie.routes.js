import { Router } from "express";

import {
  getTrending,
  getPopular,
  getTopRated,
  search,
  getById,
 semanticSearch,
 syncMovieVectors,
} from "../controllers/movie.controller.js";

import { validateQuery, validateParams } from "../middleware/validate.middleware.js";

import {
  searchQuerySchema,
  movieIdParamSchema,
} from "../validators/movie.validator.js";

// Import your existing semantic-search controller here.
// Use its actual exported name and file path from your project.

const router = Router();

// Public movie browsing routes
router.get("/trending", getTrending);
router.get("/popular", getPopular);
router.get("/top-rated", getTopRated);

// Regular movie search
router.get("/search", validateQuery(searchQuerySchema), search);

// IMPORTANT: Register semantic search before "/:id".
// Add the semantic-search route here using your existing controller.
router.get("/semantic-search", semanticSearch);
// Movie details — keep this after all static routes.
router.get("/:id", validateParams(movieIdParamSchema), getById);
router.post("/semantic-sync", syncMovieVectors);
export default router;
