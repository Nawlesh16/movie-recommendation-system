export default function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-dark-800 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AI CineMatch Platform. Phase 1 Frontend Foundation.</p>
        <p className="mt-2">Built with React, Vite, and Tailwind CSS.</p>
      </div>
    </footer>
  );
}