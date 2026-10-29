import { useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Bookmark, Eye, Star, Trash2 } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import Button from "../common/Button";
import * as interactionService from "../../services/interactionService";

export default function MovieInteractionControls({ tmdbId }) {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const interactionQuery = useQuery({
    queryKey: ["interactions", tmdbId],
    queryFn: () => interactionService.getInteraction(tmdbId),
    enabled: Boolean(user),
    retry: false,
  });

  const interaction = interactionQuery.data;
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["interactions", tmdbId] });
    queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    queryClient.invalidateQueries({ queryKey: ["interactions", "favorites"] });
    queryClient.invalidateQueries({ queryKey: ["interactions", "watchlist"] });
    queryClient.invalidateQueries({ queryKey: ["interactions", "watched"] });
    queryClient.invalidateQueries({ queryKey: ["interactions", "ratings"] });
  };

  const toggle = async (enabled, on, off) => {
    if (busy) return;
    setBusy(true);
    try {
      await (enabled ? off(tmdbId) : on(tmdbId));
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const rate = async (value) => {
    if (!user || busy) return;
    setBusy(true);
    try {
      if (interaction?.rating === value) await interactionService.removeRating(tmdbId);
      else await interactionService.setRating(tmdbId, value);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return <p className="text-gray-400 text-sm">Log in to rate, favorite, watchlist, and track watched movies.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-400 mb-2">Your rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              disabled={busy}
              onClick={() => rate(value)}
              aria-label={`Rate ${value} out of 5`}
              className="p-1 rounded hover:bg-dark-700 disabled:opacity-50"
            >
              <Star className={`w-6 h-6 ${interaction?.rating >= value ? "text-yellow-400 fill-current" : "text-gray-500"}`} />
            </button>
          ))}
          {interaction?.rating && (
            <button type="button" onClick={() => interactionService.removeRating(tmdbId).then(refresh)} className="ml-2 text-gray-500 hover:text-white" title="Remove rating">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => toggle(Boolean(interaction?.isFavorite), interactionService.addFavorite, interactionService.removeFavorite)}
          className={`flex items-center justify-center gap-2 ${interaction?.isFavorite ? "border-primary text-primary" : ""}`}
        >
          <Heart className={`w-4 h-4 ${interaction?.isFavorite ? "fill-current" : ""}`} />
          {interaction?.isFavorite ? "Favorited" : "Favorite"}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => toggle(Boolean(interaction?.isWatchlisted), interactionService.addWatchlist, interactionService.removeWatchlist)}
          className={`flex items-center justify-center gap-2 ${interaction?.isWatchlisted ? "border-primary text-primary" : ""}`}
        >
          <Bookmark className={`w-4 h-4 ${interaction?.isWatchlisted ? "fill-current" : ""}`} />
          {interaction?.isWatchlisted ? "In Watchlist" : "Watchlist"}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => toggle(Boolean(interaction?.isWatched), interactionService.markWatched, interactionService.unmarkWatched)}
          className={`flex items-center justify-center gap-2 ${interaction?.isWatched ? "border-primary text-primary" : ""}`}
        >
          <Eye className={`w-4 h-4 ${interaction?.isWatched ? "fill-current" : ""}`} />
          {interaction?.isWatched ? "Watched" : "Mark Watched"}
        </Button>
      </div>
    </div>
  );
}
