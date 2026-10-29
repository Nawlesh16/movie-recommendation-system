// Validation rules for the movie routes, written the same way as auth.validator.js.
import { z } from "zod";

export const searchQuerySchema = z.object({
  query: z
    .string({ required_error: "A search query is required" })
    .trim()
    .min(1, "A search query is required")
    .max(100, "Search query is too long"),
});

// TMDB ids are positive integers. Requiring digits-only here means a bad id
// (like "abc" or an injection attempt) never reaches TMDB or MongoDB at all.
export const movieIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Movie id must be a number")
    .transform((value) => Number(value)),
});
