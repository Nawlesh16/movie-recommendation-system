// Business logic for the user's own profile.
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export async function updateProfile(userId, { name }) {
  const user = await User.findByIdAndUpdate(
    userId,
    { name },
    { new: true, runValidators: true } // return the updated document, and run schema rules
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
}
