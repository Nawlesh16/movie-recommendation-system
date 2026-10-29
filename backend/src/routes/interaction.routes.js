import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  rate, removeRating, favorite, unfavorite, watchlist, unwatchlist,
  watched, unwatched, getOne, favorites, watchlists, watchedList, ratings
} from "../controllers/interaction.controller.js";

const router = Router();
router.use(protect);

router.post("/:tmdbId/rating", rate);
router.delete("/:tmdbId/rating", removeRating);
router.post("/:tmdbId/favorite", favorite);
router.delete("/:tmdbId/favorite", unfavorite);
router.post("/:tmdbId/watchlist", watchlist);
router.delete("/:tmdbId/watchlist", unwatchlist);
router.post("/:tmdbId/watched", watched);
router.delete("/:tmdbId/watched", unwatched);

router.get("/favorites", favorites);
router.get("/watchlist", watchlists);
router.get("/watched", watchedList);
router.get("/ratings", ratings);
router.get("/:tmdbId", getOne);

export default router;
