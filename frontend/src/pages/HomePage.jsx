import { Link } from 'react-router-dom';
import MovieSection from '../components/movie/MovieSection';
import MovieGrid from '../components/movie/MovieGrid';
import { getTrendingMovies, getPopularMovies, getTopRatedMovies } from '../services/movieService';
import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../contexts/AuthContext';
import { getRecommendations } from '../services/recommendationService';

export default function HomePage() {
  const { user } = useContext(AuthContext);
  const { data: recommendationData, isLoading: recommendationsLoading, isError: recommendationsError, refetch: retryRecommendations } = useQuery({
    queryKey: ['recommendations', 'home'],
    queryFn: () => getRecommendations(10),
    enabled: Boolean(user),
    retry: false,
  });
  const recommendations = recommendationData?.movies || [];

  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center bg-dark-800 border-b border-dark-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900 to-transparent z-10" />
        <div className="relative z-20 text-center px-4 max-w-3xl">
          <h1 className="text-5xl font-extrabold text-white mb-4">Discover Your Next Favorite Movie</h1>
          <p className="text-xl text-gray-300 mb-8">Powered by AI, tailored perfectly to your taste.</p>
          <Link to="/search" className="bg-primary text-white px-8 py-3 rounded text-lg font-bold hover:bg-red-700 transition">
            Start Exploring
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {user && (
          <div className="mb-10">
            {recommendationsLoading && <p className="text-gray-400 py-4" role="status">Loading your recommendations…</p>}
            <MovieGrid
              title={recommendationData?.personalized ? "Personalized Recommendations" : "Popular Movies To Get You Started"}
              movies={recommendations}
            />
            {recommendationsError && (
              <div className="text-center -mt-4 mb-8 text-sm text-gray-300" role="alert">
                <p>Recommendations could not be loaded right now.</p>
                <button type="button" onClick={() => retryRecommendations()} className="mt-2 text-primary hover:underline">Try again</button>
              </div>
            )}
            {!recommendationsLoading && !recommendations.length && (
              <p className="text-gray-500 text-sm -mt-6 mb-8">Rate or favorite a few movies to build your recommendations.</p>
            )}
          </div>
        )}
        <MovieSection title="Trending Movies" queryKey={['movies', 'trending']} queryFn={getTrendingMovies} />
        <MovieSection title="Popular Movies" queryKey={['movies', 'popular']} queryFn={getPopularMovies} />
        <MovieSection title="Top Rated Movies" queryKey={['movies', 'top-rated']} queryFn={getTopRatedMovies} />
      </div>
    </div>
  );
}
