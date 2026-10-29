import { runQuery } from "./neo4j.service.js";
import * as movieService from "./movie.service.js";

const toNumber = (value) => Number(value?.toNumber ? value.toNumber() : value);

function movieFromRecord(record, key = "movie") {
  const movie = record.get(key);
  if (!movie) return null;
  return { ...movie.properties, tmdbId: toNumber(movie.properties.tmdbId) };
}

function graphRows(records) {
  return records.map((record) => {
    const movie = movieFromRecord(record);
    return {
      movie,
      matchedGenres: record.get("matchedGenres") || [],
      matchedActors: record.get("matchedActors") || [],
      matchedDirectors: record.get("matchedDirectors") || [],
      matchedKeywords: record.get("matchedKeywords") || [],
      matchedLanguages: record.get("matchedLanguages") || [],
      graphScore: Number(record.get("graphScore") || 0),
      explanation: record.get("explanation") || "Matched by graph relationships.",
    };
  }).filter((row) => row.movie);
}

export async function syncMovieToGraph(movie) {
  const params = {
    tmdbId: Number(movie.tmdbId),
    title: movie.title || "",
    overview: movie.overview || "",
    releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().slice(0, 10) : null,
    popularity: Number(movie.popularity || 0),
    voteAverage: Number(movie.rating || 0),
    posterPath: movie.posterPath || null,
    originalLanguage: movie.originalLanguage || null,
    genres: (movie.genres || []).map((g) => ({ id: Number(g.id), name: String(g.name) })).filter((g) => g.name),
    actors: (movie.cast || []).map((a) => ({ tmdbId: Number(a.id), name: a.name, character: a.character || null })).filter((a) => Number.isInteger(a.tmdbId) && a.name),
    director: movie.director ? { tmdbId: Number(movie.directorId || 0), name: movie.director } : null,
    keywords: (movie.keywords || []).map((name) => String(name).trim()).filter(Boolean),
    productionCompanies: (movie.productionCompanies || []).map((p) => ({ tmdbId: Number(p.id), name: p.name })).filter((p) => Number.isInteger(p.tmdbId) && p.name),
  };

  await runQuery(`
    MERGE (m:Movie {tmdbId: $tmdbId})
    SET m.title = $title, m.overview = $overview, m.releaseDate = $releaseDate,
        m.popularity = $popularity, m.voteAverage = $voteAverage,
        m.posterPath = $posterPath, m.originalLanguage = $originalLanguage,
        m.updatedAt = datetime()
    WITH m
    OPTIONAL MATCH (m)-[old:HAS_GENRE|ACTED_BY|DIRECTED_BY|HAS_KEYWORD|IN_LANGUAGE|PRODUCED_BY]->()
    DELETE old
    RETURN m`, params);

  await runQuery(`
    MATCH (m:Movie {tmdbId: $tmdbId})
    UNWIND $genres AS item
    MERGE (g:Genre {name: item.name})
    SET g.tmdbId = item.id
    MERGE (m)-[:HAS_GENRE]->(g)`, params);

  await runQuery(`
    MATCH (m:Movie {tmdbId: $tmdbId})
    UNWIND $actors AS item
    MERGE (a:Actor {tmdbId: item.tmdbId})
    SET a.name = item.name
    MERGE (m)-[r:ACTED_BY]->(a)
    SET r.character = item.character`, params);

  if (params.director?.name) {
    if (params.director.tmdbId) {
      await runQuery(`
        MATCH (m:Movie {tmdbId: $tmdbId})
        MERGE (d:Director {tmdbId: $directorTmdbId})
        SET d.name = $directorName
        MERGE (m)-[:DIRECTED_BY]->(d)`, { ...params, directorTmdbId: params.director.tmdbId, directorName: params.director.name });
    } else {
      await runQuery(`
        MATCH (m:Movie {tmdbId: $tmdbId})
        MERGE (d:Director {name: $directorName})
        MERGE (m)-[:DIRECTED_BY]->(d)`, { ...params, directorName: params.director.name });
    }
  }

  await runQuery(`
    MATCH (m:Movie {tmdbId: $tmdbId})
    UNWIND $keywords AS name
    MERGE (k:Keyword {name: name})
    MERGE (m)-[:HAS_KEYWORD]->(k)`, params);

  if (params.originalLanguage) {
    await runQuery(`
      MATCH (m:Movie {tmdbId: $tmdbId})
      MERGE (l:Language {code: $originalLanguage})
      MERGE (m)-[:IN_LANGUAGE]->(l)`, params);
  }

  await runQuery(`
    MATCH (m:Movie {tmdbId: $tmdbId})
    UNWIND $productionCompanies AS item
    MERGE (p:ProductionCompany {tmdbId: item.tmdbId})
    SET p.name = item.name
    MERGE (m)-[:PRODUCED_BY]->(p)`, params);

  await syncSimilarRelationships(Number(movie.tmdbId));
  return { tmdbId: Number(movie.tmdbId), synced: true };
}

export async function syncSimilarRelationships(tmdbId) {
await runQuery(`
MATCH (m {tmdbId: $tmdbId})
OPTIONAL MATCH (m)-[]->(g)<-[]-(other)
WHERE other.tmdbId <> $tmdbId
WITH m, other, count(DISTINCT g) AS sharedGenres

OPTIONAL MATCH (m)-[:ACTED_BY]->(a:Actor)<-[:ACTED_BY]-(other)
WITH m, other, sharedGenres, count(DISTINCT a) AS sharedActors

OPTIONAL MATCH (m)-[:DIRECTED_BY]->(d:Director)<-[:DIRECTED_BY]-(other)
WITH m, other, sharedGenres, sharedActors,
     count(DISTINCT d) AS sharedDirectors

OPTIONAL MATCH (m)-[:HAS_KEYWORD]->(k:Keyword)<-[:HAS_KEYWORD]-(other)
WITH m, other, sharedGenres, sharedActors, sharedDirectors,
     count(DISTINCT k) AS sharedKeywords

WITH m, other, sharedGenres, sharedActors, sharedDirectors, sharedKeywords,
     (sharedGenres * 0.35 +
      sharedActors * 0.30 +
      sharedDirectors * 0.20 +
      sharedKeywords * 0.15) AS score

WHERE other IS NOT NULL AND score > 0

MERGE (m)-[r:SIMILAR_TO]->(other)
SET r.score = score,
    r.sharedGenres = sharedGenres,
    r.sharedActors = sharedActors,
    r.sharedDirectors = sharedDirectors,
    r.sharedKeywords = sharedKeywords

`, { tmdbId });
}

export async function getMoviesByGenre(genre, limit = 20) { 
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 20)); 
  const records = await runQuery( ` 
    MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre)
    WHERE toLower(g.name) CONTAINS toLower($genre) WITH m, collect(g.name) AS matchedGenres 
    RETURN m AS movie, matchedGenres AS matchedGenres, [] AS matchedActors, [] AS matchedDirectors, [] AS matchedKeywords, [] AS matchedLanguages, 0.7 AS graphScore, 'Matched the requested genre through HAS_GENRE.' AS explanation ORDER BY m.popularity DESC, m.voteAverage DESC LIMIT toInteger($limit) `, { genre, limit: safeLimit } ); 
  return graphRows(records);
 }

export async function getMoviesByActor(actor, limit = 20) {
   const safeLimit = Math.max(1, Math.floor(Number(limit) || 20));
   const records = await runQuery( ` 
    MATCH (m:Movie)-[:ACTED_BY]->(a:Actor) 
    WHERE toLower(a.name) CONTAINS toLower($actor) WITH m, collect(DISTINCT a.name) AS matchedActors 
    RETURN m AS movie, [] AS matchedGenres, matchedActors AS matchedActors, [] AS matchedDirectors, [] AS matchedKeywords, [] AS matchedLanguages, 0.8 AS graphScore, 'Matched an actor connected to the movie.' AS explanation ORDER BY m.popularity DESC, m.voteAverage DESC LIMIT toInteger($limit) `, { actor, limit: safeLimit } ); 
    return graphRows(records); }

export async function getMoviesByDirector(director, limit = 20) { 
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 20)); 
  const records = await runQuery( ` 
    MATCH (m:Movie)-[:DIRECTED_BY]->(d:Director) 
    WHERE toLower(d.name) CONTAINS toLower($director) WITH m, collect(DISTINCT d.name) AS matchedDirectors 
    RETURN m AS movie, [] AS matchedGenres, [] AS matchedActors, matchedDirectors AS matchedDirectors, [] AS matchedKeywords, [] AS matchedLanguages, 0.85 AS graphScore, 'Matched a director connected to the movie.' AS explanation ORDER BY m.popularity DESC, m.voteAverage DESC LIMIT toInteger($limit) `, { director, limit: safeLimit } ); 
    return graphRows(records); }

export async function getMoviesByLanguage(language, limit = 20) { 
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 20)); 
  const records = await runQuery( ` 
  MATCH (m:Movie)-[:IN_LANGUAGE]->(l:Language) 
  WHERE toLower(l.code) = toLower($language) WITH m, collect(DISTINCT l.code) AS matchedLanguages 
  RETURN m AS movie, [] AS matchedGenres, [] AS matchedActors, [] AS matchedDirectors, [] AS matchedKeywords, matchedLanguages AS matchedLanguages, 0.65 AS graphScore, 'Matched the requested original language.' AS explanation ORDER BY m.popularity DESC, m.voteAverage DESC LIMIT toInteger($limit) `, { language, limit: safeLimit } ); 
  return graphRows(records); }

export async function getSimilarMoviesByGraph(tmdbId, limit = 20) { 
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 20)); 
  const records = await runQuery( ` 
    MATCH (m:Movie {tmdbId: $tmdbId})-[r:SIMILAR_TO]->(other:Movie) 
    RETURN other AS movie, [] AS matchedGenres, [] AS matchedActors, [] AS matchedDirectors, [] AS matchedKeywords, [] AS matchedLanguages, r.score AS graphScore, 'Matched through shared graph relationships with the selected movie.' AS explanation ORDER BY r.score DESC, other.popularity DESC LIMIT toInteger($limit) `, { tmdbId: Number(tmdbId), limit: safeLimit } ); 
    return graphRows(records); }

export async function getActorBridgeMovies(tmdbId, limit = 20) { 
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 20)); 
  const records = await runQuery( ` 
  MATCH (source:Movie {tmdbId: $tmdbId})-[:ACTED_BY]->(a:Actor)<-[:ACTED_BY]-(other:Movie) 
  WHERE other.tmdbId <> $tmdbId WITH other, collect(DISTINCT a.name) AS matchedActors 
  RETURN other AS movie, [] AS matchedGenres, matchedActors AS matchedActors, [] AS matchedDirectors, [] AS matchedKeywords, [] AS matchedLanguages, (0.6 + 0.1 * size(matchedActors)) AS graphScore, 'Matched because the movie shares one or more actors with the selected movie.' AS explanation ORDER BY graphScore DESC, other.popularity DESC LIMIT toInteger($limit) `, { tmdbId: Number(tmdbId), limit: safeLimit } ); 
  return graphRows(records); }

export async function getMoviesByKeyword(keyword, limit = 20) { 
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 20)); 
  const records = await runQuery( ` 
  MATCH (m:Movie)-[:HAS_KEYWORD]->(k:Keyword) 
  WHERE toLower(k.name) CONTAINS toLower($keyword) WITH m, collect(DISTINCT k.name) AS matchedKeywords 
  RETURN m AS movie, [] AS matchedGenres, [] AS matchedActors, [] AS matchedDirectors, matchedKeywords AS matchedKeywords, [] AS matchedLanguages, 0.7 AS graphScore, 'Matched a movie keyword through the knowledge graph.' AS explanation ORDER BY m.popularity DESC, m.voteAverage DESC LIMIT toInteger($limit) `, { keyword, limit: safeLimit } ); 
  return graphRows(records); }

export async function getDirectorsOfGenre(genre, limit = 20) { 
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 20)); 
  const records = await runQuery( ` 
  MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre), (m)-[:DIRECTED_BY]->(d:Director) 
  WHERE toLower(g.name) CONTAINS toLower($genre) WITH d, collect(DISTINCT g.name) AS matchedGenres MATCH (other:Movie)-[:DIRECTED_BY]->(d) WITH DISTINCT other, matchedGenres, d 
  RETURN other AS movie, matchedGenres AS matchedGenres, [] AS matchedActors, [d.name] AS matchedDirectors, [] AS matchedKeywords, [] AS matchedLanguages, 0.82 AS graphScore, 'Matched because its director also directed movies in the requested genre.' AS explanation ORDER BY graphScore DESC, other.popularity DESC LIMIT toInteger($limit) `, { genre, limit: safeLimit } ); 
  return graphRows(records); }

export async function getActorBridgeByGenre(genre, limit = 20) { 
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 20)); 
  const records = await runQuery( ` 
  MATCH (source:Movie)-[:HAS_GENRE]->(g:Genre), (source)-[:ACTED_BY]->(a:Actor)<-[:ACTED_BY]-(other:Movie) 
  WHERE toLower(g.name) CONTAINS toLower($genre) WITH other, collect(DISTINCT a.name) AS matchedActors, collect(DISTINCT g.name) AS matchedGenres 
  RETURN other AS movie, matchedGenres AS matchedGenres, matchedActors AS matchedActors, [] AS matchedDirectors, [] AS matchedKeywords, [] AS matchedLanguages, (0.55 + 0.08 * size(matchedActors)) AS graphScore, 'Matched through actors who appear in movies of the requested genre.' AS explanation ORDER BY graphScore DESC, other.popularity DESC LIMIT toInteger($limit) `, { genre, limit: safeLimit } ); 
  return graphRows(records); }

export async function getMoviesByProductionCompany(company, limit = 20) { 
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 20)); 
  const records = await runQuery( ` MATCH (m:Movie)-[:PRODUCED_BY]->(p:ProductionCompany) 
    WHERE toLower(p.name) CONTAINS toLower($company) WITH m, collect(DISTINCT p.name) AS matchedCompanies 
    RETURN m AS movie, [] AS matchedGenres, [] AS matchedActors, [] AS matchedDirectors, matchedCompanies AS matchedKeywords, [] AS matchedLanguages, 0.68 AS graphScore, 'Matched through a production company relationship.' AS explanation ORDER BY graphScore DESC, m.popularity DESC, m.voteAverage DESC LIMIT toInteger($limit) `, { company, limit: safeLimit } ); 
    return graphRows(records); }

export async function getEntityMatches(text, limit = 5) {
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 5));
  const records = await runQuery(
    `
    MATCH (g:Genre)
    WHERE toLower($text) CONTAINS toLower(g.name)
    RETURN 'genre' AS type, g.name AS name
    LIMIT toInteger($limit)

    UNION ALL

    MATCH (a:Actor)
    WHERE toLower($text) CONTAINS toLower(a.name)
    RETURN 'actor' AS type, a.name AS name
    LIMIT toInteger($limit)

    UNION ALL

    MATCH (d:Director)
    WHERE toLower($text) CONTAINS toLower(d.name)
    RETURN 'director' AS type, d.name AS name
    LIMIT toInteger($limit)

    UNION ALL

    MATCH (k:Keyword)
    WHERE size(k.name) >= 4
      AND toLower($text) CONTAINS toLower(k.name)
    RETURN 'keyword' AS type, k.name AS name
    LIMIT toInteger($limit)
    `,
    { text, limit: safeLimit }
  );

  return records.map((record) => ({
    type: record.get("type"),
    name: record.get("name"),
  }));
}


export async function syncPopularMoviesToGraph(count = 20) {
const limit = Math.max(1, Math.min(Number(count) || 20, 500));
const pageSize = 20;
const pagesNeeded = Math.ceil(limit / pageSize);

// console.log("Requested count:", count);
// console.log("Calculated limit:", limit);
// console.log("Pages needed:", pagesNeeded);

const movieSummaries = [];
for (let page = 1; page <= pagesNeeded; page++) {
const popularMovies = await movieService.getPopularMovies(page);
movieSummaries.push(...popularMovies);
}
const uniqueMovies = [
...new Map(
movieSummaries
.filter((movie) => movie.tmdbId)
.slice(0, limit)
.map((movie) => [movie.tmdbId, movie])
).values(),
];
const results = {
requested: uniqueMovies.length,
synced: 0,
failed: [],
};
// First sync movie nodes and their relationships.
for (const summary of uniqueMovies) {
try {
const movie = await movieService.getMovieDetails(summary.tmdbId);

  await syncMovieToGraph(movie);

  results.synced++;
} catch (error) {
  console.error(
    `Bulk graph sync failed for TMDB movie ${summary.tmdbId}:`,
    error.message
  );
 results.failed.push({
    tmdbId: summary.tmdbId,
    title: summary.title,
    message: error.message,
  });
}
}
return {
...results,
message: "Bulk movie graph sync completed",
};
}