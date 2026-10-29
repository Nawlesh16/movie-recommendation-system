import { useQuery } from '@tanstack/react-query';
import { getPopularMovies } from '../services/movieService';
import MovieGrid from '../components/movie/MovieGrid';
import Loader from '../components/common/Loader';

export default function MoviesPage() {
  const { data: movies, isLoading, isError, error } = useQuery({
    queryKey: ['movies', 'popular'],
    queryFn: getPopularMovies,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Explore Movies</h1>
      <p className="text-gray-400 mb-8">Browse popular movies.</p>
      {isLoading ? (
        <Loader text="Loading movies..." />
      ) : isError ? (
        <div className="text-red-300 border border-red-500 bg-red-500/10 rounded-lg py-4 px-4 text-center">
          {error.message}
        </div>
      ) : (
        <MovieGrid movies={movies} />
      )}
    </div>
  );
}
