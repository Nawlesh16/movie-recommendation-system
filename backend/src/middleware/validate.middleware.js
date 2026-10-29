// Turns a Zod schema into an Express middleware.
// Usage in a route:  router.post("/register", validate(registerSchema), register)
import { ApiError } from "../utils/ApiError.js";

function toFieldErrors(zodError) {
  return zodError.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      throw new ApiError(400, "Validation failed", toFieldErrors(result.error));
    }

    // Replace the body with the cleaned data (trimmed, lowercased email, unknown fields removed).
    req.body = result.data;
    next();
  };
}

// Same idea as validate(), but for the query string - e.g. GET /movies/search?query=...
// Query values arrive as strings, so schemas here should expect strings (or use
// z.coerce.number() etc. if a numeric query param is ever needed).
//
// NOTE: in Express 5, `req.query` is a getter-only property (a deliberate
// security fix), so `req.query = ...` THROWS under ESM's strict mode. We
// mutate the existing object in place with Object.assign instead of replacing it.
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query ?? {});

    if (!result.success) {
      throw new ApiError(400, "Validation failed", toFieldErrors(result.error));
    }

    Object.assign(req.query, result.data);
    next();
  };
}

// Same idea again, but for route params - e.g. the ":id" in GET /movies/:id.
// req.params IS a normal writable property in Express 5, but we mutate it the
// same way as req.query above for consistency (and in case that ever changes).
export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params ?? {});

    if (!result.success) {
      throw new ApiError(400, "Validation failed", toFieldErrors(result.error));
    }

    Object.assign(req.params, result.data);
    next();
  };
}
