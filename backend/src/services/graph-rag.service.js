import { Movie } from "../models/Movie.js";
import * as graphService from "./graph.service.js";
import { ApiError } from "../utils/ApiError.js";
import { generateGraphAnswer } from "./groq.service.js";

const KNOWN_GENRE_ALIASES = [
  ["science fiction", "Science Fiction"],
  ["sci-fi", "Science Fiction"],
  ["action", "Action"],
  ["adventure", "Adventure"],
  ["animation", "Animation"],
  ["comedy", "Comedy"],
  ["crime", "Crime"],
  ["documentary", "Documentary"],
  ["drama", "Drama"],
  ["fantasy", "Fantasy"],
  ["horror", "Horror"],
  ["mystery", "Mystery"],
  ["romance", "Romance"],
  ["thriller", "Thriller"],
  ["war", "War"],
  ["western", "Western"],
];

function normalizeQuery(query) {
  const value = String(query || "").trim().replace(/\s+/g, " ");
  if (!value) throw new ApiError(400, "Graph search query is required");
  if (value.length > 200) throw new ApiError(400, "Graph search query is too long");
  return value;
}

export function parseGraphIntent(query, entities = []) {
  const text = query.toLowerCase();
 const genres = KNOWN_GENRE_ALIASES
    .filter(([alias]) => text.includes(alias))
    .map(([, name]) => name);

  const actor =entities.find((e) => e.type === "actor")?.name || null;
  const director =entities.find((e) => e.type === "director")?.name || null;
  const keyword =entities.find((e) => e.type === "keyword")?.name || null;

  const similar =/\b(similar|like|sharing genres|connected through)\b/.test(text);

  const actorBridge =/\b(shared actor|sharing actors|actors who|same actor|worked with|through actors|actor connections?)\b/.test(text);

  const directorBridge =
  /\b(same director|through directors?|or directors?|director connections?|directed films|shared director|sharing directors)\b/.test(text);

  const relationshipIntent =similar ||actorBridge ||directorBridge ||
    /\b(connected|connection|relationships?)\b/.test(text) ||
    Boolean(actor || director || genres.length);

  const language =text.match(/\b(english|hindi|french|spanish|german|japanese|korean|fr|es|de|ja|ko|en|hi)\b/i)?.[1] ||null;

  return {
    genres: [...new Set(genres)],
    actor,
    director,
    keyword,
    language,
    similar,
    actorBridge,
    directorBridge,
    relationshipIntent,
  };
}

async function findMovieTitle(text) {
  const normalizedText = text.trim();

  const patterns = [
    /\bsimilar to\s+(.+?)(?=\s+(?:and|with|through|by)\b|$)/i,
    /\blike\s+(.+?)(?=\s+(?:and|with|through|by)\b|$)/i,
    /\bsharing actors with\s+(.+?)(?=\s+(?:and|with|through|by)\b|$)/i,
    /\bconnected to\s+(.+?)(?=\s+(?:and|with|through|by)\b|$)/i,
  ];

  let title = null;

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);

    if (match?.[1]) {
      title = match[1].trim();
      break;
    }
  }

  if (!title) return null;

  // Remove trailing relationship words if present.
  title = title.replace(/\s+(through|by|with|and)$/i, "").trim();

  if (!title) return null;

  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return Movie.findOne({
    title: { $regex: `^${escapedTitle}$`, $options: "i" },
  }).lean();
}

function dedupe(rows) {
  const map = new Map();
  for (const row of rows) {
  const id = row.movie?.tmdbId;
  if (!id) continue;
  const current = map.get(id);
  if (!current) {
   map.set(id, row);
      continue;
    }
  if (row.graphScore > current.graphScore) {
    row.matchedGenres = [
        ...new Set([
          ...(row.matchedGenres || []),
          ...(current.matchedGenres || []),
        ]),
      ];
    row.matchedActors = [
        ...new Set([
          ...(row.matchedActors || []),
          ...(current.matchedActors || []),
        ]),
      ];
      row.matchedDirectors = [
        ...new Set([
          ...(row.matchedDirectors || []),
          ...(current.matchedDirectors || []),
        ]),
      ];
      row.matchedKeywords = [
        ...new Set([
          ...(row.matchedKeywords || []),
          ...(current.matchedKeywords || []),
        ]),
      ];
    map.set(id, row);
    } else {
      current.matchedGenres = [
        ...new Set([
          ...(current.matchedGenres || []),
          ...(row.matchedGenres || []),
        ]),
      ];
      current.matchedActors = [
        ...new Set([
          ...(current.matchedActors || []),
          ...(row.matchedActors || []),
        ]),
      ];
      current.matchedDirectors = [
        ...new Set([
          ...(current.matchedDirectors || []),
          ...(row.matchedDirectors || []),
        ]),
      ];
    current.matchedKeywords = [
        ...new Set([
          ...(current.matchedKeywords || []),
          ...(row.matchedKeywords || []),
        ]),
      ];
    }
  }

  return [...map.values()];
}

export async function graphSearch(query, limit = 12) {
  const normalized = normalizeQuery(query);
  const entities = await graphService.getEntityMatches(normalized);
  const intent = parseGraphIntent(normalized, entities);
  const movieTitle = await findMovieTitle(normalized);
  const resultSets = [];

  if (
  movieTitle &&
  (intent.similar || intent.actorBridge || intent.directorBridge)
) {
  if (intent.similar) {
    resultSets.push(
      await graphService.getSimilarMoviesByGraph(
        movieTitle.tmdbId,
        limit * 2
      )
    );
  }

  if (intent.actorBridge) {
    resultSets.push(
      await graphService.getActorBridgeMovies(
        movieTitle.tmdbId,
        limit * 2
      )
    );
  }

  if (intent.directorBridge) {
    resultSets.push(
      await graphService.getSimilarMoviesByGraph(
        movieTitle.tmdbId,
        limit * 2
      )
    );
  }
}
  if (intent.actor) resultSets.push(await graphService.getMoviesByActor(intent.actor, limit * 2));
  if (intent.director) resultSets.push(await graphService.getMoviesByDirector(intent.director, limit * 2));
  if (intent.directorBridge && intent.genres.length) {
    for (const genre of intent.genres) resultSets.push(await graphService.getDirectorsOfGenre(genre, limit * 2));
  }
  if (intent.actorBridge && intent.genres.length) {
    for (const genre of intent.genres) resultSets.push(await graphService.getActorBridgeByGenre(genre, limit * 2));
  }
  if (intent.keyword) resultSets.push(await graphService.getMoviesByKeyword(intent.keyword, limit * 2));
  for (const genre of intent.genres) resultSets.push(await graphService.getMoviesByGenre(genre, limit * 2));
  if (intent.language) resultSets.push(await graphService.getMoviesByLanguage(intent.language, limit * 2));

  if (!resultSets.length && entities.length) {
    for (const entity of entities) {
      if (entity.type === "genre") resultSets.push(await graphService.getMoviesByGenre(entity.name, limit * 2));
      if (entity.type === "actor") resultSets.push(await graphService.getMoviesByActor(entity.name, limit * 2));
      if (entity.type === "director") resultSets.push(await graphService.getMoviesByDirector(entity.name, limit * 2));
      if (entity.type === "keyword") resultSets.push(await graphService.getMoviesByKeyword(entity.name, limit * 2));
    }
  }

  const rows = dedupe(resultSets.flat())
    .sort((a, b) => b.graphScore - a.graphScore || (b.movie.popularity || 0) - (a.movie.popularity || 0))
    .slice(0, limit);

  return { query: normalized, intent, entities, movies: rows };
}

export function graphExplanation(row) {
  const reasons = [];
  if (row.matchedGenres?.length) reasons.push(`genre: ${row.matchedGenres.join(", ")}`);
  if (row.matchedActors?.length) reasons.push(`actor: ${row.matchedActors.join(", ")}`);
  if (row.matchedDirectors?.length) reasons.push(`director: ${row.matchedDirectors.join(", ")}`);
  if (row.matchedKeywords?.length) reasons.push(`keyword: ${row.matchedKeywords.join(", ")}`);
  return reasons.length ? `Matched through ${reasons.join("; ")}.` : row.explanation;
}

export async function graphRagAnswer(query, limit = 12) {
  // Reuse the existing, working graph retrieval.
  const result = await graphSearch(query, limit);

  // Convert graph rows into context for the LLM.
  const movies = result.movies.map((row) => ({
    ...row.movie,

    graphScore: row.graphScore,

    matchedGenres: row.matchedGenres || [],
    matchedActors: row.matchedActors || [],
    matchedDirectors: row.matchedDirectors || [],
    matchedKeywords: row.matchedKeywords || [],

    explanation: graphExplanation(row),
  }));

  // Generate an answer using retrieved graph data.
  const generated = await generateGraphAnswer({
    query: result.query,
    movies,
  });

  return {
    query: result.query,
    intent: result.intent,
    entities: result.entities,

    answer: generated.answer,
    grounded: generated.grounded,
    model: generated.model || null,

    movies,
  };
}