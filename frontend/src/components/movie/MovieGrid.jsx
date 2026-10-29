import MovieCard from './MovieCard';

export default function MovieGrid({ movies, title }) {
  if (!movies?.length) {
    return <p className="text-gray-400 py-8 text-center">No movies found.</p>;
  }

  return (
    <section className="my-8">
      {title && <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-primary pl-3">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {movies.map(movie => (
          <MovieCard key={movie.tmdbId} movie={movie} />
        ))}
      </div>
    </section>
  );
}