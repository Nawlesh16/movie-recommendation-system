// "protect" guards a route: only requests with a valid token get through.
// The client must send:   Authorization: Bearer <token>
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../services/token.service.js";

export async function protect(req, res, next) {
  // 1. Read the token from the Authorization header.
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Authentication required. Send the header: Authorization: Bearer <token>");
  }

  // 2. Check the signature and expiry.
  const payload = verifyAccessToken(token);

  // 3. Make sure the user still exists.
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, "The user belonging to this token no longer exists");
  }

  // 4. Make sure the token wasn't invalidated by a logout.
  if (payload.tv !== user.tokenVersion) {
    throw new ApiError(401, "Your session has ended. Please log in again.");
  }

  // 5. Make the user available to the next handlers as req.user.
  req.user = user;
  next();
}
