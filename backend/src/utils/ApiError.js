// An error we throw ON PURPOSE (wrong password, missing token, ...).
// It carries an HTTP status code so the error middleware knows what to reply.
//
//   throw new ApiError(404, "Movie not found");
//   throw new ApiError(400, "Validation failed", [{ field: "email", message: "..." }]);
export class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors; // optional list of field-level problems
  }
}
