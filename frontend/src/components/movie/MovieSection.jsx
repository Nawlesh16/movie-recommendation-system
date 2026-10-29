// A titled row of movies that fetches its own data: one of these per section
// (Trending / Popular / Top Rated) instead of repeating the same
// useQuery + loading/error/grid wiring three times on HomePage.
import { useQuery } from '@tanstack/react-query';
import MovieGrid from './MovieGrid';
import Loader from '../common/Loader';

export default function MovieSection({ title, queryKey, queryFn }) {
  const { data: movies, isLoading, isError, error } = useQuery({ queryKey, queryFn });

  if (isLoading) {
    return <Loader text={`Loading ${title.toLowerCase()}...`} />;
  }

  if (isError) {
    return (
      <div className="my-8 rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        Couldn't load {title.toLowerCase()}: {error.message}
      </div>
    );
  }

  return <MovieGrid title={title} movies={movies} />;
}
