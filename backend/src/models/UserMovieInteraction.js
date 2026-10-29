import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tmdbId: { type: Number, required: true },
    rating: { type: Number, min: 1, max: 5, default: null },
    isFavorite: { type: Boolean, default: false },
    isWatchlisted: { type: Boolean, default: false },
    isWatched: { type: Boolean, default: false },
  },
  { timestamps: true }
);

interactionSchema.index({ user: 1, tmdbId: 1 }, { unique: true });
interactionSchema.index({ user: 1, isFavorite: 1 });
interactionSchema.index({ user: 1, isWatchlisted: 1 });
interactionSchema.index({ user: 1, isWatched: 1 });

export const UserMovieInteraction = mongoose.model("UserMovieInteraction", interactionSchema);
