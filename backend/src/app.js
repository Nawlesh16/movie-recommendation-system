// Builds the Express app (middleware + routes) but does NOT start listening.
// Keeping this separate from server.js makes the app easy to test later.
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(helmet()); // sets safer HTTP headers
app.use(cors({ origin: env.clientUrl })); // only our frontend may call the API from a browser
app.use(express.json({ limit: "10kb" })); // parse JSON bodies (and reject huge ones)

app.use("/api", routes);

// Must come after all routes:
app.use(notFound);
app.use(errorHandler);

export default app;
