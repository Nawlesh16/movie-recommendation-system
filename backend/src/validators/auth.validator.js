// Validation rules written with Zod. A "schema" describes what valid input looks like.
// If the request body doesn't match, the validate middleware replies with 400.
import { z } from "zod";

const nameField = z
  .string({ required_error: "Name is required" })
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be at most 50 characters");

const emailField = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Please provide a valid email address");

// bcrypt only uses the first 72 bytes of a password, so we cap it at 72.
const newPasswordField = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  password: newPasswordField,
});

export const loginSchema = z.object({
  email: emailField,
  // On login we only check that something was sent; the real check is against the hash.
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: nameField,
});
