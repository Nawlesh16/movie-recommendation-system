// Stores movies we've already looked up, so a second request for the same
// movie doesn't need to call TMDB again. Only movie DETAILS are cached here
// (see movie.service.js) - trending/popular/top-rated/search are proxied
// straight from TMDB without writing to the database on every request.
//
// The shape here is deliberately broader than the current UI needs, because
// later phases (content-based recommendations, embeddings, vector/graph
// search) will read genres, cast, and popularity signals from this collection.
import mongoose from "mongoose";

const castMemberSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true }, // TMDB person id
    name: { type: String, required: true },
    character: { type: String },
    profilePath: { type: String, default: null },
  },
  { _id: false }
);

const genreSchema = new mongoose.Schema(
  { id: { type: Number, required: true }, name: { type: String, required: true } },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true, // one document per TMDB movie; also creates an index
    },
    title: { type: String, required: true },
    originalTitle: { type: String },
    overview: { type: String },
    posterPath: { type: String, default: null }, // TMDB path only, e.g. "/abc123.jpg"
    backdropPath: { type: String, default: null },
    releaseDate: { type: Date, default: null }, // null when TMDB has no/invalid date
    rating: { type: Number, default: 0 }, // TMDB vote_average (0-10)
    voteCount: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 },
    // Full genre objects (only known once we've fetched movie DETAILS from TMDB).
    genres: { type: [genreSchema], default: [] },
    // Genre ids alone (available even from list/search results) - kept separate
    // and indexed so future recommendation queries can filter by genre cheaply.
    genreIds: { type: [Number], default: [], index: true },
    runtime: { type: Number, default: null }, // minutes; only known from movie details
    originalLanguage: { type: String },
    adult: { type: Boolean, default: false },
    cast: { type: [castMemberSchema], default: [] },
  },
  { timestamps: true }
);

// Lets a future "browse by title" feature do a text search without a new migration.
movieSchema.index({ title: "text" });

export const Movie = mongoose.model("Movie", movieSchema);
