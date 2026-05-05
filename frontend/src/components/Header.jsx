import { Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 bg-cream-50/85 backdrop-blur-md border-b-[3px] border-ink-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-hot-400 border-[3px] border-ink-900 shadow-brutal-sm flex items-center justify-center font-display font-bold text-white text-xl group-hover:rotate-[-8deg] group-hover:-translate-y-0.5 transition-transform">
                T
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-lime-300 border-2 border-ink-900 rounded-full" />
            </div>
            <div className="leading-tight">
              <h1 className="font-display font-bold text-lg text-ink-900">
                teencode
                <span className="text-hot-400">.</span>
              </h1>
              <p className="text-[11px] text-ink-900/60 font-medium hidden sm:block">
                slang dictionary for parents
              </p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            {!isAdmin && (
              <Link
                to="/admin/login"
                className="btn btn-ghost py-2 px-3 text-sm gap-1.5"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">admin</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
