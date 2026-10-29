import { updateProfile } from "../services/user.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

// req.user was attached by the "protect" middleware.
export async function getMe(req, res) {
  sendSuccess(res, { message: "Profile fetched successfully", data: { user: req.user } });
}

export async function updateMe(req, res) {
  const user = await updateProfile(req.user.id, req.body);
  sendSuccess(res, { message: "Profile updated successfully", data: { user } });
}
