// Collects all route files under the /api prefix.
import { Router } from "express";
import mongoose from "mongoose";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import movieRoutes from "./movie.routes.js";
import interactionRoutes from "./interaction.routes.js";
import recommendationRoutes from "./recommendation.routes.js";
import graphRoutes from "./graph.routes.js";
import { sendSuccess } from "../utils/apiResponse.js";

const router = Router();

// Health check: handy for "is the server up?" and for deployment platforms.
router.get("/health", (req, res) => {
  sendSuccess(res, {
    message: "API is running",
    data: {
      uptimeSeconds: Math.round(process.uptime()),
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    },
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/movies", movieRoutes);
router.use("/interactions", interactionRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/graph", graphRoutes);

export default router;
