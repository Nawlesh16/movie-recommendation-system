const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

export function buildMovieEmbeddingText(movie) {
  const genres = (movie.genres || [])
    .map((genre) => typeof genre === "string" ? genre : genre?.name)
    .filter(Boolean)
    .join(", ");

  const genreIds = (movie.genreIds || []).join(", ");
  const cast = (movie.cast || []).map((member) => member?.name).filter(Boolean).slice(0, 10).join(", ");
  const keywords = (movie.keywords || []).filter(Boolean).slice(0, 20).join(", ");
  const releaseYear = movie.releaseDate
    ? new Date(movie.releaseDate).getUTCFullYear()
    : "";

  return [
    `Title: ${clean(movie.title)}`,
    `Overview: ${clean(movie.overview)}`,
    `Genres: ${clean(genres) || genreIds || "Unknown"}`,
    `Language: ${clean(movie.originalLanguage) || "Unknown"}`,
    `Release Year: ${releaseYear || "Unknown"}`,
    `Cast: ${clean(cast) || "Unknown"}`,
    `Director: ${clean(movie.director) || "Unknown"}`,
    `Keywords: ${clean(keywords) || "Unknown"}`,
  ].join("\n");
}

export function movieEmbeddingContentHash(movie) {
  const text = buildMovieEmbeddingText(movie);
  // Node's built-in crypto keeps hashing deterministic without another dependency.
  return text;
}
