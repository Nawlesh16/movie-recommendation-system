import { getNeo4jDriver } from "../config/neo4j.js";
import { env } from "../config/env.js";

function requireDriver() {
  const driver = getNeo4jDriver();
  if (!driver) {
    const error = new Error("Neo4j is not configured. Set NEO4J_URI, NEO4J_USERNAME and NEO4J_PASSWORD.");
    error.code = "NEO4J_NOT_CONFIGURED";
    throw error;
  }
  return driver;
}

export async function runQuery(query, params = {}) {
  const driver = requireDriver();
  const session = driver.session({ database: env.neo4jDatabase || undefined });
  try {
    const result = await session.run(query, params);
    return result.records;
  } finally {
    await session.close();
  }
}

export async function verifyConnection() {
  const driver = requireDriver();
  await driver.verifyConnectivity();
  return true;
}

export async function createConstraints() {
  const queries = [
    "CREATE CONSTRAINT movie_tmdb_id IF NOT EXISTS FOR (m:Movie) REQUIRE m.tmdbId IS UNIQUE",
    "CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE",
    "CREATE CONSTRAINT actor_tmdb_id IF NOT EXISTS FOR (a:Actor) REQUIRE a.tmdbId IS UNIQUE",
    "CREATE CONSTRAINT director_tmdb_id IF NOT EXISTS FOR (d:Director) REQUIRE d.tmdbId IS UNIQUE",
    "CREATE CONSTRAINT keyword_name IF NOT EXISTS FOR (k:Keyword) REQUIRE k.name IS UNIQUE",
    "CREATE CONSTRAINT language_code IF NOT EXISTS FOR (l:Language) REQUIRE l.code IS UNIQUE",
    "CREATE CONSTRAINT production_company_tmdb_id IF NOT EXISTS FOR (p:ProductionCompany) REQUIRE p.tmdbId IS UNIQUE",
  ];
  for (const query of queries) await runQuery(query);
}

export async function createIndexes() {
  const queries = [
    "CREATE INDEX movie_title IF NOT EXISTS FOR (m:Movie) ON (m.title)",
    "CREATE INDEX actor_name IF NOT EXISTS FOR (a:Actor) ON (a.name)",
    "CREATE INDEX director_name IF NOT EXISTS FOR (d:Director) ON (d.name)",
    "CREATE INDEX keyword_name_search IF NOT EXISTS FOR (k:Keyword) ON (k.name)",
  ];
  for (const query of queries) await runQuery(query);
}

export async function initializeNeo4j() {
  await verifyConnection();
  await createConstraints();
  await createIndexes();
}
