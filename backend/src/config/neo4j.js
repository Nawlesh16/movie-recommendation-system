import neo4j from "neo4j-driver";
import { env } from "./env.js";

let driver;

function isConfigured() {
  return Boolean(env.neo4jUri && env.neo4jUsername && env.neo4jPassword);
}

export function getNeo4jDriver() {
  if (!isConfigured()) return null;
  if (!driver) {
    driver = neo4j.driver(
      env.neo4jUri,
      neo4j.auth.basic(env.neo4jUsername, env.neo4jPassword),
      { maxConnectionPoolSize: 20, connectionAcquisitionTimeout: 5000 }
    );
  }
  return driver;
}

export async function closeNeo4j() {
  if (driver) {
    await driver.close();
    driver = undefined;
  }
}
