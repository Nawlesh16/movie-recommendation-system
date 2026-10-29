import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Film, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 w-full bg-dark-900/95 backdrop-blur-sm border-b border-dark-800 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary hover:text-red-500 transition-colors">
          <Film className="w-6 h-6" />
          <span className="text-xl font-bold">AI CineMatch</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link to="/search" className="text-gray-300 hover:text-white">Search</Link>
          <Link to="/movies" className="text-gray-300 hover:text-white">Movies</Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/watchlist" className="text-gray-300 hover:text-white">Watchlist</Link>
              <Link to="/profile" className="text-gray-300 hover:text-white flex items-center gap-1">
                <User className="w-4 h-4" /> {user.username}
              </Link>
              <button onClick={handleLogout} className="text-gray-400 hover:text-primary">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link to="/login" className="text-gray-300 hover:text-white px-3 py-1">Login</Link>
              <Link to="/register" className="bg-primary text-white px-4 py-1 rounded hover:bg-red-700 transition">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}