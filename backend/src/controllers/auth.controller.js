// Controllers translate HTTP <-> our services:
// read from req, call a service, send a response. No business logic here.
import { registerUser, loginUser, logoutUser } from "../services/auth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function register(req, res) {
  const { user, token } = await registerUser(req.body);
  sendSuccess(res, { statusCode: 201, message: "Account created successfully", data: { user, token } });
}

export async function login(req, res) {
  const { user, token } = await loginUser(req.body);
  sendSuccess(res, { message: "Logged in successfully", data: { user, token } });
}

export async function logout(req, res) {
  await logoutUser(req.user.id);
  sendSuccess(res, { message: "Logged out successfully. Please discard your token." });
}
