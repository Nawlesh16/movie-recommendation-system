// Loads variables from the ".env" file and exposes them as one tidy object.
// Every other file imports `env` from here instead of touching process.env,
// so there is exactly ONE place that knows about environment variables.
import dotenv from "dotenv";

dotenv.config();

// The app cannot work without these, so we stop immediately with a clear message.
const requiredVars = ["MONGODB_URI", "JWT_SECRET", "TMDB_API_KEY"];
const missing = requiredVars.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error('Copy ".env.example" to ".env" and fill in the values.');
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV || "development";

// A short secret is easy to guess, so we refuse to run in production with one.
if (nodeEnv === "production" && process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters in production.");
  process.exit(1);
}

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  tmdbApiKey: process.env.TMDB_API_KEY,
  tmdbBaseUrl: process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3",

  // Neo4j
  neo4jUri: process.env.NEO4J_URI,
  neo4jUsername: process.env.NEO4J_USERNAME,
  neo4jPassword: process.env.NEO4J_PASSWORD,
  neo4jDatabase: process.env.NEO4J_DATABASE || "neo4j",

groqApiKey: process.env.GROQ_API_KEY,
groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",

baselineRecommendationWeight: Number(
  process.env.BASELINE_RECOMMENDATION_WEIGHT ?? 0.5
),
semanticRecommendationWeight: Number(
  process.env.SEMANTIC_RECOMMENDATION_WEIGHT ?? 0.3
),
graphRecommendationWeight: Number(
  process.env.GRAPH_RECOMMENDATION_WEIGHT ?? 0.2
),

// Semantic search and Qdrant
embeddingModel:
  process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",

embeddingDimension: Number(process.env.EMBEDDING_DIMENSION) || 384,

qdrantUrl: process.env.QDRANT_URL,

qdrantApiKey: process.env.QDRANT_API_KEY,

qdrantCollectionName:
  process.env.QDRANT_COLLECTION_NAME || "movies",
};
