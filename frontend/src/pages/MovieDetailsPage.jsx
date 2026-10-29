import { useParams } from 'react-router-dom';
import { useQuery ,useMutation,useQueryClient,} from '@tanstack/react-query';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import { Star, Heart, BookmarkPlus,Loader2 } from 'lucide-react';
import {
  getPosterUrl,
  getBackdropUrl,
  getProfileUrl,
  getReleaseYear,
  getGenreNames,
  formatRuntime,
  FALLBACK_POSTER,
} from '../utils/movieHelpers';

import { useContext,useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';

import {
  getMovieById,
  getMovieInteraction,
  addFavorite,
  removeFavorite,
  addToWatchlist,
  removeFromWatchlist,
  rateMovie,
  removeMovieRating,
} from '../services/movieService';

export default function MovieDetailsPage() {
  const { id } = useParams();

  const { data: movie, isLoading, isError, error } = useQuery({
    queryKey: ['movies', 'details', id],
    queryFn: () => getMovieById(id),
  });

const auth = useContext(AuthContext);
const user = auth?.user;
const queryClient = useQueryClient();

const { data: interaction } = useQuery({
  queryKey: ['interactions', id],
  queryFn: () => getMovieInteraction(id),
  enabled: Boolean(user && id),
  retry: false,
});

const isFavorite = Boolean(interaction?.isFavorite);
const isWatchlisted = Boolean(interaction?.isWatchlisted);

const [selectedRating, setSelectedRating] = useState(null);

const currentRating = interaction?.rating ?? 0;

const ratingMutation = useMutation({
  mutationFn: (rating) => {
    if (rating === 0) {
      return removeMovieRating(id);
    }

    return rateMovie(id, rating);
  },

  onSuccess: (updatedInteraction) => {
    queryClient.setQueryData(
      ['interactions', id],
      updatedInteraction
    );

    queryClient.invalidateQueries({
      queryKey: ['interactions', id],
    });

    setSelectedRating(null);
  },

  onError: (error) => {
    console.error(
      'Rating save failed:',
      error.response?.data || error.message
    );

    window.alert(
      error.response?.data?.message ||
      'Rating save nahi ho paayi. Please try again.'
    );
  },
});

const handleRating = (rating) => {
  if (!user) {
    window.alert('Please log in to rate this movie.');
    return;
  }

  // Selected star dobara click karne par rating remove hogi.
  const nextRating = currentRating === rating ? 0 : rating;

  setSelectedRating(nextRating);
  ratingMutation.mutate(nextRating);
};

const interactionMutation = useMutation({
  mutationFn: async ({ type, active }) => {
    if (type === 'favorite') {
      return active ? removeFavorite(id) : addFavorite(id);
    }

    if (type === 'watchlist') {
      return active
        ? removeFromWatchlist(id)
        : addToWatchlist(id);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['interactions', id],
    });
  },
});

const handleInteraction = (type, active) => {
  if (!user) {
    window.alert('Please log in to use this feature.');
    return;
  }

  interactionMutation.mutate({ type, active });
};

  if (isLoading) return <div className="mt-20"><Loader text="Loading movie details..." /></div>;

  if (isError) {
    // A bad id (non-numeric) comes back as a field error from our backend's
    // validator; an unknown-but-valid-looking id comes back as a plain 404
    // message. Show whichever one the backend actually sent.
    const message = error.fieldErrors?.id || error.message;
    return (
      <div className="max-w-xl mx-auto mt-20 text-center">
        <p className="text-white text-xl mb-2">Couldn't load this movie.</p>
        <p className="text-gray-400">{message}</p>
      </div>
    );
  }

  if (!movie) return <div className="text-center mt-20 text-white">Movie not found.</div>;

  const posterUrl = getPosterUrl(movie.posterPath) || FALLBACK_POSTER;
  const backdropUrl = getBackdropUrl(movie.backdropPath);
  const year = getReleaseYear(movie.releaseDate);
  const genreNames = getGenreNames(movie.genres);
  const runtime = formatRuntime(movie.runtime);

  return (
    <div>
      {backdropUrl && (
        <div
          className="h-[40vh] bg-cover bg-center relative"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-dark-900/40" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster Sidebar */}
          <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full rounded-lg shadow-xl mb-4"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_POSTER;
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
                disabled={interactionMutation.isPending}
                onClick={() => handleInteraction('favorite', isFavorite)}
              >
                <Heart className="w-4 h-4" />
                {isFavorite ? 'Favorited' : 'Favorite'}
              </Button>

              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
                disabled={interactionMutation.isPending}
                onClick={() => handleInteraction('watchlist', isWatchlisted)}
              >
                <BookmarkPlus className="w-4 h-4" />
                {isWatchlisted ? 'In Watchlist' : 'Watchlist'}
              </Button>
            </div>
          </div>

          {/* Info Area */}
          <div className="w-full md:w-2/3 lg:w-3/4">
            <h1 className="text-4xl font-bold text-white mb-1">
              {movie.title} {year && <span className="text-gray-400 font-normal">({year})</span>}
            </h1>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-gray-500 italic mb-4">Original title: {movie.originalTitle}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-gray-300">
              <span className="flex items-center gap-1 text-yellow-500 bg-dark-800 px-2 py-1 rounded">
                <Star className="w-4 h-4 fill-current" /> {movie.rating != null ? movie.rating.toFixed(1) : 'N/A'} / 10
              </span>
              {typeof movie.voteCount === 'number' && (
                <span className="text-gray-400">{movie.voteCount.toLocaleString()} votes</span>
              )}
              {runtime && <span className="bg-dark-800 px-2 py-1 rounded">{runtime}</span>}
              {movie.originalLanguage && (
                <span className="bg-dark-800 px-2 py-1 rounded uppercase">{movie.originalLanguage}</span>
              )}
              {genreNames.map((name) => (
                <span key={name} className="px-2 py-1 bg-dark-700 rounded-full border border-dark-600">{name}</span>
              ))}
            </div>
             
              <div className="mb-8 p-5 rounded-lg bg-dark-800 border border-dark-700">
        <h3 className="text-xl font-semibold text-white mb-2">
          Your Rating
        </h3>

  <p className="text-gray-400 text-sm mb-4">
    Rate this movie from 1 to 5 stars.
  </p>

  <div className="flex items-center gap-2">
    {[1, 2, 3, 4, 5].map((rating) => {
      const activeRating = selectedRating ?? currentRating;


  return (
    <button
      key={rating}
      type="button"
      aria-label={`Rate ${rating} out of 5 stars`}
      title={`${rating} star${rating > 1 ? 's' : ''}`}
      disabled={ratingMutation.isPending || !user}
      onClick={() => handleRating(rating)}
      className="disabled:opacity-50 transition-transform hover:scale-110"
    >
      <Star
        className={`w-8 h-8 ${
          rating <= activeRating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-500'
        }`}
      />
    </button>
  );
})}

{ratingMutation.isPending && (
  <Loader2 className="w-5 h-5 animate-spin text-gray-400 ml-2" />
)}


  </div>

  <p className="text-sm text-gray-400 mt-3">
    {currentRating > 0
      ? `Your saved rating: ${currentRating}/5`
      : 'You have not rated this movie yet.'}
  </p>

{!user && ( <p className="text-sm text-yellow-500 mt-2">
Log in to rate this movie. </p>
)}

{currentRating > 0 && (
<button
type="button"
disabled={ratingMutation.isPending || !user}
onClick={() => {
setSelectedRating(0);
ratingMutation.mutate(0);
}}
className="text-sm text-red-400 hover:text-red-300 mt-3 disabled:opacity-50"
>
Remove my rating </button>
)}

</div>

              
            <h3 className="text-xl font-semibold text-white mb-2">Overview</h3>
            <p className="text-gray-300 leading-relaxed mb-8">{movie.overview || 'No overview available.'}</p>

            {movie.cast?.length > 0 && (
              <>
                <h3 className="text-xl font-semibold text-white mb-4">Cast</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {movie.cast.map((member) => {
                    const photoUrl = getProfileUrl(member.profilePath);
                    return (
                      <div key={member.id} className="flex-shrink-0 w-24 text-center">
                        <img
                          src={photoUrl || FALLBACK_POSTER}
                          alt={member.name}
                          className="w-24 h-24 rounded-full object-cover mb-2 bg-dark-800"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_POSTER;
                          }}
                        />
                        <p className="text-white text-sm font-medium truncate">{member.name}</p>
                        {member.character && <p className="text-gray-500 text-xs truncate">{member.character}</p>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
