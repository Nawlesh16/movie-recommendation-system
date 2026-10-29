// Small, reusable transforms between the backend's Movie shape and what the
// UI displays. Centralizing these here keeps components from repeating
// TMDB-specific details (image base URLs, date parsing, etc).

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const FALLBACK_POSTER = "https://via.placeholder.com/500x750?text=No+Poster";

// The backend sends image PATHS like "/abc123.jpg", not full URLs (that's how
// TMDB itself returns them). Build the full URL here, and return null when
// there's no path so callers can show a fallback image instead of a broken one.
export function getPosterUrl(posterPath, size = "w500") {
  return posterPath ? `${TMDB_IMAGE_BASE}/${size}${posterPath}` : null;
}

export function getBackdropUrl(backdropPath, size = "w1280") {
  return backdropPath ? `${TMDB_IMAGE_BASE}/${size}${backdropPath}` : null;
}

export function getProfileUrl(profilePath, size = "w185") {
  return profilePath ? `${TMDB_IMAGE_BASE}/${size}${profilePath}` : null;
}

// Backend sends releaseDate as an ISO date string (or null). The UI only ever
// needs the year.
export function getReleaseYear(releaseDate) {
  if (!releaseDate) return null;
  const year = new Date(releaseDate).getFullYear();
  return Number.isNaN(year) ? null : year;
}

// genres: [{ id, name }] -> ["Action", "Drama"]
export function getGenreNames(genres) {
  return (genres || []).map((genre) => genre.name);
}

// 169 -> "2h 49m"
export function formatRuntime(minutes) {
  if (minutes === null || minutes === undefined) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}
