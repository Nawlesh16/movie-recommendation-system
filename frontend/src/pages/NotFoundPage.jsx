import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-white mb-6">Page Not Found</h2>
      <p className="text-gray-400 mb-8 max-w-md">
        The movie reel snapped! We couldn't find the page you're looking for.
      </p>
      <Link to="/" className="bg-primary text-white px-6 py-2 rounded font-medium hover:bg-red-700 transition">
        Return Home
      </Link>
    </div>
  );
}