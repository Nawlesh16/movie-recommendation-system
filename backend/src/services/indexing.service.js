import crypto from "node:crypto";
import { Movie } from "../models/Movie.js";
import { buildMovieEmbeddingText } from "./movieEmbeddingText.service.js";
import { generateEmbedding, getEmbeddingModelInfo } from "./embedding.service.js";
import { upsertMovieVector, ensureCollection } from "./qdrant.service.js";
import { env } from "../config/env.js";

function contentHash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function indexMovie(movie, { force = false } = {}) {
  const text = buildMovieEmbeddingText(movie);
  const hash = contentHash(text);

  if (!force && movie.embeddingVersion === env.embeddingModel && movie.embeddingContentHash === hash) {
    return { tmdbId: movie.tmdbId, skipped: true };
  }

  const vector = await generateEmbedding(text);
  await upsertMovieVector(movie, vector, hash);

  await Movie.updateOne(
    { _id: movie._id },
    {
      $set: {
        embeddingVersion: env.embeddingModel,
        embeddingContentHash: hash,
        embeddingUpdatedAt: new Date(),
      },
    }
  );

  return { tmdbId: movie.tmdbId, skipped: false };
}

export async function indexExistingMovies({ batchSize = 10, force = false } = {}) {
  await ensureCollection();
  const total = await Movie.countDocuments({ adult: { $ne: true } });
  let processed = 0;
  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  const cursor = Movie.find({ adult: { $ne: true } }).sort({ _id: 1 }).cursor();

  let batch = [];
  for await (const movie of cursor) {
    batch.push(movie);
    if (batch.length >= batchSize) {
      for (const item of batch) {
        try {
          const result = await indexMovie(item, { force });
          processed += 1;
          if (result.skipped) skipped += 1;
          else indexed += 1;
          console.log(`[index] ${processed}/${total} tmdbId=${item.tmdbId} ${result.skipped ? "skipped" : "indexed"}`);
        } catch (error) {
          failed += 1;
          processed += 1;
          console.error(`[index] FAILED tmdbId=${item.tmdbId}: ${error.message}`);
        }
      }
      batch = [];
    }
  }

  for (const item of batch) {
    try {
      const result = await indexMovie(item, { force });
      processed += 1;
      if (result.skipped) skipped += 1;
      else indexed += 1;
      console.log(`[index] ${processed}/${total} tmdbId=${item.tmdbId} ${result.skipped ? "skipped" : "indexed"}`);
    } catch (error) {
      failed += 1;
      processed += 1;
      console.error(`[index] FAILED tmdbId=${item.tmdbId}: ${error.message}`);
    }
  }

  return { total, processed, indexed, skipped, failed, embedding: getEmbeddingModelInfo() };
}
