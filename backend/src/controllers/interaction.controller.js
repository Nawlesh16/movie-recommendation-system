import * as service from "../services/interaction.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

const tmdbId = (req) => Number(req.params.tmdbId);

export async function rate(req, res) {
  const interaction = await service.setRating(req.user.id, tmdbId(req), Number(req.body.rating));
  sendSuccess(res, { statusCode: 200, message: "Movie rating saved", data: { interaction } });
}
export async function removeRating(req, res) {
  const interaction = await service.removeRating(req.user.id, tmdbId(req));
  sendSuccess(res, { message: "Movie rating removed", data: { interaction } });
}
export async function favorite(req, res) {
  const interaction = await service.addFavorite(req.user.id, tmdbId(req));
  sendSuccess(res, { message: "Movie added to favorites", data: { interaction } });
}
export async function unfavorite(req, res) {
  const interaction = await service.removeFavorite(req.user.id, tmdbId(req));
  sendSuccess(res, { message: "Movie removed from favorites", data: { interaction } });
}
export async function watchlist(req, res) {
  const interaction = await service.addWatchlist(req.user.id, tmdbId(req));
  sendSuccess(res, { message: "Movie added to watchlist", data: { interaction } });
}
export async function unwatchlist(req, res) {
  const interaction = await service.removeWatchlist(req.user.id, tmdbId(req));
  sendSuccess(res, { message: "Movie removed from watchlist", data: { interaction } });
}
export async function watched(req, res) {
  const interaction = await service.markWatched(req.user.id, tmdbId(req));
  sendSuccess(res, { message: "Movie marked as watched", data: { interaction } });
}
export async function unwatched(req, res) {
  const interaction = await service.unmarkWatched(req.user.id, tmdbId(req));
  sendSuccess(res, { message: "Movie marked as unwatched", data: { interaction } });
}
export async function getOne(req, res) {
  const interaction = await service.getInteraction(req.user.id, tmdbId(req));
  sendSuccess(res, { message: "Movie interaction fetched", data: { interaction } });
}
export async function favorites(req, res) {
  sendSuccess(res, { message: "Favorites fetched", data: { interactions: await service.listFavorites(req.user.id) } });
}
export async function watchlists(req, res) {
  sendSuccess(res, { message: "Watchlist fetched", data: { interactions: await service.listWatchlist(req.user.id) } });
}
export async function watchedList(req, res) {
  sendSuccess(res, { message: "Watched movies fetched", data: { interactions: await service.listWatched(req.user.id) } });
}
export async function ratings(req, res) {
  sendSuccess(res, { message: "Ratings fetched", data: { interactions: await service.listRatings(req.user.id) } });
}
