import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { search, similar, sync, initialize, graphRag,} from "../controllers/graph.controller.js";
import * as graphController from "../controllers/graph.controller.js";

const router = Router();

// Search is validated and parameterized; no raw Cypher is exposed.
router.get("/search", search);
router.get("/similar/:tmdbId", similar);
router.get("/rag", graphRag);

// Development/admin-style operations are protected. The existing User model has
// no role field, so Phase 6 does not invent a role system; these are not public.
router.post("/sync/popular", protect, graphController.syncPopular);
router.post("/sync/:tmdbId", protect, sync);
router.post("/initialize", protect, initialize);


export default router;
