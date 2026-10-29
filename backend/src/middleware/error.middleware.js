// Two middlewares that must be registered LAST in app.js:
//   notFound     -> runs when no route matched
//   errorHandler -> runs whenever anything throws an error (Express 5 forwards
//                   errors from async functions here automatically)
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Express recognises an error handler by its 4 parameters, so keep `next` even if unused.
export function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = "Internal server error";
  let errors = null;

  if (err instanceof ApiError) {
    // Errors we threw on purpose.
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === "ValidationError") {
    // Mongoose schema validation failed.
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    // MongoDB "duplicate key" (e.g. two users registering the same email at once).
    const field = Object.keys(err.keyValue || {})[0] || "value";
    statusCode = 409;
    message = `That ${field} is already in use`;
  } else if (err.name === "CastError") {
    // e.g. an invalid MongoDB ObjectId.
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.type === "entity.parse.failed") {
    // The request body wasn't valid JSON.
    statusCode = 400;
    message = "Request body contains invalid JSON";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  } else {
    // A real bug. Log it for us, but don't leak details to the client in production.
    console.error("Unexpected error:", err);
    if (!env.isProduction) message = err.message || message;
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (statusCode === 500 && !env.isProduction) body.stack = err.stack;

  res.status(statusCode).json(body);
}
