import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchMovies } from '../services/movieService';
import { semanticSearchMovies } from '../services/recommendationService';
import { graphSearchMovies } from '../services/graphService';
import SearchBar from '../components/movie/SearchBar';
import MovieGrid from '../components/movie/MovieGrid';
import Loader from '../components/common/Loader';

const MODES = [
  { id: 'tmdb', label: 'Title Search' },
  { id: 'semantic', label: 'Semantic Search' },
  { id: 'graph', label: 'Graph Search' },
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState('tmdb');

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['movies', mode, searchQuery],
    queryFn: async () => {
      if (mode === 'semantic') return { movies: await semanticSearchMovies(searchQuery) };
      if (mode === 'graph') return await graphSearchMovies(searchQuery);
      return { movies: await searchMovies(searchQuery) };
    },
    enabled: Boolean(searchQuery),
    retry: false,
  });

  const movies = data?.movies || [];
  const modeDescription = mode === 'graph'
    ? 'Find movies through actors, directors, genres, keywords and multi-hop relationships.'
    : mode === 'semantic'
      ? 'Describe the kind of movie you want in natural language.'
      : 'Find a movie by title.';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Search Movies</h1>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">{modeDescription}</p>
        <SearchBar onSearch={setSearchQuery} />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`px-4 py-2 rounded-full text-sm border transition ${mode === item.id ? 'bg-primary text-white border-primary' : 'text-gray-300 border-dark-600 hover:border-gray-400'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {mode === 'graph' && (
          <p className="text-xs text-gray-500 mt-3">
            Try: “movies directed by Christopher Nolan” or “movies sharing actors with Interstellar”.
          </p>
        )}
      </div>

      {isFetching || isLoading ? (
        <Loader text={mode === 'graph' ? 'Traversing movie relationships...' : mode === 'semantic' ? 'Finding semantically relevant movies...' : 'Searching movies...'} />
      ) : isError ? (
        <div className="text-center text-red-300 border border-red-500 bg-red-500/10 rounded-lg py-6 max-w-xl mx-auto">
          {error.message}
        </div>
      ) : searchQuery ? (
        <>
          <MovieGrid title={`${MODES.find((item) => item.id === mode)?.label} results for "${searchQuery}"`} movies={movies} />
          {mode === 'graph' && movies.length > 0 && (
            <div className="mt-6 grid gap-3 max-w-4xl mx-auto">
              {movies.slice(0, 6).map((movie) => (
                <div key={movie.tmdbId} className="rounded-lg border border-dark-700 bg-dark-800/60 p-4 text-sm text-gray-300">
                  <span className="text-white font-semibold">{movie.title}</span>
                  {movie.explanation && <span className="ml-2 text-gray-400">— {movie.explanation}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 py-12 border border-dashed border-dark-700 rounded-lg">
          Start typing to search for a movie.
        </div>
      )}
    </div>
  );
}
