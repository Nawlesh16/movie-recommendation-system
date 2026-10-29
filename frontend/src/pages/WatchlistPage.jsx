import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getWatchlistMovies } from '../services/movieService';
import Loader from '../components/common/Loader';
import { getPosterUrl, FALLBACK_POSTER } from '../utils/movieHelpers';

export default function WatchlistPage() {
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['interactions', 'watchlist'],
    queryFn: getWatchlistMovies,
    retry: 1,
  });

  // Backend response ko array mein convert karne ki koshish
  const movies = Array.isArray(data)
    ? data
    : data?.watchlist ??
      data?.movies ??
      data?.interactions ??
      data?.data?.watchlist ??
      [];

  if (isLoading) {
    return (
      <div className="mt-20">
        <Loader text="Loading your watchlist..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          My Watchlist
        </h1>

        <p className="text-red-400">
          Watchlist load nahi ho paayi.
          {' '}
          {error?.response?.data?.message || error?.message}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">
        My Watchlist
      </h1>

      <p className="text-gray-400 mb-8">
        Movies you plan to watch later.
      </p>

      {movies.length === 0 ? (
        <div className="text-center text-gray-500 py-12 border border-dashed border-dark-700 rounded-lg">
          <p className="text-lg mb-2">
            Your watchlist is currently empty.
          </p>

          <Link
            to="/movies"
            className="text-primary hover:underline"
          >
            Explore movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.map((item) => {
            // Kuch APIs interaction ke andar movie object bhejti hain.
            const movie = item.movie ?? item;

            const movieId =
              movie.tmdbId ??
              movie.tmdbID ??
              movie.id ??
              item.tmdbId;

            const title = movie.title ?? 'Untitled Movie';

            const posterPath =
              movie.posterPath ??
              movie.poster_path;

            const posterUrl =
              getPosterUrl(posterPath) || FALLBACK_POSTER;

            return (
              <Link
                key={movieId}
                to={`/movies/${movieId}`}
                className="group block overflow-hidden rounded-lg bg-dark-800 hover:scale-[1.02] transition-transform"
              >
                <img
                  src={posterUrl}
                  alt={title}
                  className="w-full aspect-[2/3] object-cover"
                  loading="lazy"
                />

                <div className="p-3">
                  <h2 className="text-white font-semibold line-clamp-2">
                    {title}
                  </h2>

                  {movie.releaseDate && (
                    <p className="text-sm text-gray-400 mt-1">
                      {movie.releaseDate.slice(0, 4)}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}