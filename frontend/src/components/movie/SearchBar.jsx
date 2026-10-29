import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a movie title..."
        className="w-full px-6 py-4 pl-14 rounded-full bg-dark-800 border border-dark-700 text-white focus:outline-none focus:border-primary shadow-lg"
      />
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      <button 
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-red-700 transition"
      >
        Search
      </button>
    </form>
  );
}