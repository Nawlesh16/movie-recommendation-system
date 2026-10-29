// Business logic for registration, login and logout.
// Controllers stay thin (they only talk HTTP); the real work happens here.
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { signAccessToken } from "./token.service.js";

export async function registerUser({ name, email, password }) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // The password is hashed automatically by the pre("save") hook in the User model.
  const user = await User.create({ name, email, password });
  const token = signAccessToken(user);

  return { user, token };
}

export async function loginUser({ email, password }) {
  // "+password" asks Mongoose to include the hash, which is hidden by default.
  const user = await User.findOne({ email }).select("+password");

  const passwordIsCorrect = user ? await user.comparePassword(password) : false;

  // Same message for "no such email" and "wrong password" so attackers
  // can't use the login form to discover which emails are registered.
  if (!passwordIsCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signAccessToken(user);
  return { user, token };
}

// Logout strategy: JWTs are stateless, so the server can't "delete" one.
// Instead we bump tokenVersion. Every token issued before now carries the
// old number, so the auth middleware will reject all of them.
export async function logoutUser(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
}
