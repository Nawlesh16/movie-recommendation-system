// Limits how often one IP address can call register/login.
// This makes "guess the password" attacks much slower.
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: env.isProduction ? 20 : 100, // more relaxed while developing/testing
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, "Too many attempts. Please try again in a few minutes."));
  },
});
