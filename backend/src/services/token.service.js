// Everything about creating and checking JWTs lives here.
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

// A JWT is a signed piece of text. It contains:
//   sub = the user's id, tv = the user's tokenVersion, exp = expiry time.
// Anyone can READ it, but only our server can SIGN it (using JWT_SECRET).
// That's why we never put passwords or sensitive data inside.
export function signAccessToken(user) {
  return jwt.sign({ tv: user.tokenVersion }, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.jwtExpiresIn,
    algorithm: "HS256",
  });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Your session has expired. Please log in again.");
    }
    throw new ApiError(401, "Invalid token. Please log in again.");
  }
}
