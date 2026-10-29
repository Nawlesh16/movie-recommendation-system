import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { baseline, semantic, hybrid } from "../controllers/recommendation.controller.js";

const router = Router();
router.use(protect);

router.get("/", hybrid);
router.get("/baseline", baseline);
router.get("/semantic", semantic);

export default router;
