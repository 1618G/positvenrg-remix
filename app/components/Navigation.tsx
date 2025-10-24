import { Link } from "@remix-run/react";

export default function Navigation() {
  return (
    <nav className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sunrise-gradient rounded-full flex items-center justify-center">
              <span className="text-charcoal-900 font-bold text-lg">P</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text">PositiveNRG</h1>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link href="/companions" className="btn-ghost">
              Companions
            </Link>
            <Link href="/pricing" className="btn-ghost">
              Pricing
            </Link>
            <Link href="/safety" className="btn-ghost">
              Safety
            </Link>
            
            <Link href="/login" className="btn-ghost">
              Admin Login
            </Link>
            <Link href="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
