// Entry point: connect to MongoDB first, then start accepting requests.
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { initializeNeo4j } from "./services/neo4j.service.js";
import { closeNeo4j } from "./config/neo4j.js";

async function start() {
  try {
    await connectDB();
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    console.error("Is MongoDB running, and is MONGODB_URI in .env correct?");
    process.exit(1);
  }

  if (env.neo4jUri && env.neo4jUsername && env.neo4jPassword) {
    try {
      await initializeNeo4j();
      console.log("Neo4j graph layer connected and initialized");
    } catch (error) {
      console.warn(`Neo4j unavailable; graph features will degrade gracefully: ${error.message}`);
    }
  } else {
    console.log("Neo4j not configured; graph features are disabled until NEO4J_* variables are set");
  }

  const server = app.listen(env.port, () => {
    console.log(`API running in ${env.nodeEnv} mode on http://localhost:${env.port}/api`);
  });

  // Shut down cleanly on Ctrl+C or when a host (Docker, Render, ...) stops the app.
  async function shutdown(signal) {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      await closeNeo4j();
      process.exit(0);
    });
  }
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
  });
}

start();
