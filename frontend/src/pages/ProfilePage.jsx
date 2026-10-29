
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Mail } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-dark-800 rounded-lg p-8 border border-dark-700 shadow-xl">

        {/* Profile Header */}
        <div className="flex items-center gap-6 border-b border-dark-700 pb-8 mb-8">
          <div className="w-24 h-24 bg-dark-700 rounded-full flex items-center justify-center text-4xl text-primary font-bold">
            {user.name?.charAt(0).toUpperCase()}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {user.name}
            </h1>

            <p className="text-gray-400 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
          </div>
        </div>

        {/* Account Statistics */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            Account Statistics
          </h2>

          <div className="grid grid-cols-3 gap-4 text-center">

            <div className="bg-dark-900 p-4 rounded border border-dark-700">
              <span className="block text-2xl font-bold text-primary">
                0
              </span>
              <span className="text-sm text-gray-400">
                Ratings Given
              </span>
            </div>

            <div className="bg-dark-900 p-4 rounded border border-dark-700">
              <span className="block text-2xl font-bold text-primary">
                0
              </span>
              <span className="text-sm text-gray-400">
                Watchlist
              </span>
            </div>

            <div className="bg-dark-900 p-4 rounded border border-dark-700">
              <span className="block text-2xl font-bold text-primary">
                0
              </span>
              <span className="text-sm text-gray-400">
                Favorites
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

