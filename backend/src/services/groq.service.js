
import Groq from "groq-sdk";
import { env } from "../config/env.js";

const groq = env.groqApiKey
  ? new Groq({ apiKey: env.groqApiKey })
  : null;

const model = env.groqModel || "llama-3.3-70b-versatile";

export async function generateGraphAnswer({ query, movies }) {
  if (!groq) {
    const error = new Error(
      "Groq API is not configured. Set GROQ_API_KEY in backend .env."
    );
    error.statusCode = 503;
    throw error;
  }

  if (!movies?.length) {
    return {
      answer:
        "I couldn't find enough relevant movies in the graph to answer this query reliably.",
      grounded: true,
    };
  }

  const context = movies.slice(0, 10).map((movie) => ({
    title: movie.title,
    overview: movie.overview || "",
    genres: movie.matchedGenres || [],
    actors: movie.matchedActors || [],
    directors: movie.matchedDirectors || [],
    keywords: movie.matchedKeywords || [],
    explanation: movie.explanation || "",
  }));

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a movie recommendation assistant. Answer only from the supplied context. Never invent movies, actors, directors, or relationships. Clearly state when a relationship cannot be verified. Keep the answer concise.",
      },
      {
        role: "user",
        content: `User query:\n${query}\n\nRetrieved movie context:\n${JSON.stringify(context)}`,
      },
    ],
    temperature: 0.2,
    max_completion_tokens: 500,
  });

  const answer = completion.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error("Groq returned an empty answer.");
  }

  return {
    answer,
    grounded: true,
    model: completion.model,
  };
}

function cleanEvidence(movie) {
  return [
    ...new Set(
      (movie.recommendationEvidence || [])
        .filter((item) => typeof item === "string" && item.trim())
    ),
  ].slice(0, 5);
}

export async function explainRecommendations(movies = []) {
  if (!Array.isArray(movies) || movies.length === 0 || !groq) {
    return { movies: Array.isArray(movies) ? movies : [], groqAvailable: false };
  }

  const explainable = movies.filter(
    (movie) => cleanEvidence(movie).length > 0
  );

  if (!explainable.length) {
    return { movies, groqAvailable: false };
  }

  const allowedIds = new Set(
    explainable.map((movie) => Number(movie.tmdbId))
  );

  const input = explainable.map((movie) => ({
    tmdbId: Number(movie.tmdbId),
    title: String(movie.title || "Unknown title").slice(0, 120),
    verifiedEvidence: cleanEvidence(movie),
  }));

  try {
    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.1,
      max_completion_tokens: Math.min(1200, 100 + explainable.length * 65),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Return JSON only: {"recommendations":[{"tmdbId":number,"explanation":string}]}. Use only each movie\'s verifiedEvidence. Do not invent facts. Omit movies with insufficient evidence.',
        },
        {
          role: "user",
          content: JSON.stringify({ recommendations: input }),
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");
    const explanations = new Map();

    for (const item of Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : []) {
      const id = Number(item.tmdbId);
      const explanation =
        typeof item.explanation === "string" ? item.explanation.trim() : "";

      if (
        allowedIds.has(id) &&
        explanation.length >= 12 &&
        explanation.length <= 260
      ) {
        explanations.set(id, explanation);
      }
    }

    return {
      groqAvailable: explanations.size > 0,
      movies: movies.map((movie) => ({
        ...movie,
        explanation:
          explanations.get(Number(movie.tmdbId)) || movie.explanation,
      })),
    };
  } catch (error) {
    console.warn(
      `Groq recommendation explanations unavailable: ${error.message}`
    );
    return { movies, groqAvailable: false };
  }
}

