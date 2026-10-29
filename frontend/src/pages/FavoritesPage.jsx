export default function FavoritesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">My Favorites</h1>
      <p className="text-gray-400 mb-8">Movies you've marked as your absolute favorites.</p>
      <div className="text-center text-gray-500 py-12 border border-dashed border-dark-700 rounded-lg">
        You haven't added any favorites yet.
      </div>
    </div>
  );
}