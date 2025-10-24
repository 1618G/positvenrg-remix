import { Link } from "@remix-run/react";

export default function Navigation() {
  return (
    <nav className="bg-white/90 backdrop-blur-sm shadow-nojever sticky top-0 z-50 border-b border-nojever-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-nojever-gradient rounded-full flex items-center justify-center shadow-nojever">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text">Nojever</h1>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/companions" className="btn-ghost">
              Companions
            </Link>
            <Link to="/pricing" className="btn-ghost">
              Pricing
            </Link>
            <Link to="/safety" className="btn-ghost">
              Safety
            </Link>
            
            <Link to="/login" className="btn-ghost">
              Admin Login
            </Link>
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
