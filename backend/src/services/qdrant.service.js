import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "../config/env.js";

let client;

function getClient() {
  if (!client) {
    client = new QdrantClient({
      url: env.qdrantUrl,
      ...(env.qdrantApiKey ? { apiKey: env.qdrantApiKey } : {}),
    });
  }
  return client;
}

export async function ensureCollection() {
  const qdrant = getClient();
  try {
    await qdrant.getCollection(env.qdrantCollectionName);
    return { created: false };
  } catch (error) {
    const status = error?.status || error?.response?.status;
    if (status && status !== 404) throw error;
    await qdrant.createCollection(env.qdrantCollectionName, {
      vectors: { size: env.embeddingDimension, distance: "Cosine" },
    });
    return { created: true };
  }
}

export async function getCollectionInfo() {
  return getClient().getCollection(env.qdrantCollectionName);
}

export async function upsertMovieVector(movie, vector, contentHash) {
  await ensureCollection();

  const point = {
    id: Number(movie.tmdbId),
    vector: {
      "movie-dense": vector,
    },
    payload: {
      tmdbId: Number(movie.tmdbId),
      title: movie.title || "",
      genres: (movie.genres || [])
        .map((g) => g.name || g)
        .filter(Boolean),
      genreIds: movie.genreIds || [],
      overview: movie.overview || "",
      language: movie.originalLanguage || "",
      releaseDate: movie.releaseDate || null,
      voteAverage: movie.rating ?? 0,
      popularity: movie.popularity ?? 0,
      posterPath: movie.posterPath || null,
      backdropPath: movie.backdropPath || null,
      director: movie.director || null,
      keywords: movie.keywords || [],
      contentHash,
      embeddingVersion: env.embeddingModel,
    },
  };

  console.log("[Qdrant] Upserting point:", {
    id: point.id,
    vectorNames: Object.keys(point.vector),
    vectorDimension: vector.length,
  });

  return getClient().upsert(env.qdrantCollectionName, {
    wait: true,
    points: [point],
  });
}



export async function getMovieVector(tmdbId) {
  await ensureCollection();
  const records = await getClient().retrieve(env.qdrantCollectionName, {
    ids: [Number(tmdbId)],
    with_vector: true,
    with_payload: true,
  });
  return records?.[0] || null;
}

export async function searchMovieVectors(vector, { limit = 10, scoreThreshold, excludeTmdbId } = {}) {
  await ensureCollection();
  const filter = excludeTmdbId
    ? { must_not: [{ key: "tmdbId", match: { value: Number(excludeTmdbId) } }] }
    : undefined;

 
const result = await getClient().query(env.qdrantCollectionName, {
  query: vector,
  using: "movie-dense",
  filter,
  limit,
  with_payload: true,
  ...(typeof scoreThreshold === "number"
    ? { score_threshold: scoreThreshold }
    : {}),
});

 return result?.points || [];
}

export async function deleteMovieVector(tmdbId) {
  await ensureCollection();
  return getClient().delete(env.qdrantCollectionName, { wait: true, points: [Number(tmdbId)] });
}
