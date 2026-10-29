import { pipeline } from "@huggingface/transformers";
import { env } from "../config/env.js";

let extractorPromise = null;

async function getExtractor() {
  if (!extractorPromise) {
    console.log(`Loading Transformers.js embedding model: ${env.embeddingModel}`);
    extractorPromise = pipeline("feature-extraction", env.embeddingModel).catch((error) => {
      extractorPromise = null;
      console.error("Failed to initialize embedding model:", error.message);
      throw error;
    });
  }
  return extractorPromise;
}

export async function generateEmbedding(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Embedding text must be a non-empty string");
  }

  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  const vector = Array.from(output.data);

  if (!vector.length || vector.length !== env.embeddingDimension || vector.some((value) => !Number.isFinite(value))) {
    throw new Error(`Invalid embedding vector. Expected ${env.embeddingDimension} finite values.`);
  }

  return vector;
}

export async function warmupEmbeddingModel() {
  await getExtractor();
}

export function getEmbeddingModelInfo() {
  return {
    model: env.embeddingModel,
    dimension: env.embeddingDimension,
  };
}
