import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { getPosterUrl, getReleaseYear, FALLBACK_POSTER } from '../../utils/movieHelpers';

export default function MovieCard({ movie }) {
  // Backend movies use "tmdbId" (the real TMDB id), not "id" - there's no "id" field at all.
  const posterUrl = getPosterUrl(movie.posterPath) || FALLBACK_POSTER;
  const year = getReleaseYear(movie.releaseDate);

  return (
    <Link to={`/movie/${movie.tmdbId}`} className="group relative block rounded-lg overflow-hidden bg-dark-800 transition-transform duration-300 hover:scale-105">
      <img
        src={posterUrl}
        alt={movie.title}
        className="w-full h-auto aspect-[2/3] object-cover"
        // If the poster URL 404s (bad/removed TMDB image), fall back instead of showing a broken icon.
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = FALLBACK_POSTER;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <h3 className="text-white font-bold text-lg mb-1">{movie.title}</h3>
        {(movie.recommendationReason || movie.explanation || movie.graphExplanation) && (
          <p className="text-xs text-gray-300 leading-snug mb-2 line-clamp-3">{movie.recommendationReason || movie.explanation || movie.graphExplanation}</p>
        )}
        <div className="flex justify-between items-center text-sm text-gray-300">
          <span>{year ?? 'N/A'}</span>
          <span className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4 fill-current" /> {movie.rating != null ? movie.rating.toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>
    </Link>
  );
}