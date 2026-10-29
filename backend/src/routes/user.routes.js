import { Router } from "express";
import { getMe, updateMe } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateProfileSchema } from "../validators/auth.validator.js";

const router = Router();

// Every route in this file requires a valid token.
router.use(protect);

router.get("/me", getMe);
router.patch("/me", validate(updateProfileSchema), updateMe);

export default router;
