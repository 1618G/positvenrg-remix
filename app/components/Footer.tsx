import { Link } from "@remix-run/react";

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-sunrise-gradient rounded-full flex items-center justify-center">
                <span className="text-charcoal-900 font-bold">P</span>
              </div>
              <h3 className="text-xl font-bold">PositiveNRG</h3>
            </div>
            <p className="text-mist-400 mb-4">
              AI companions for mental wellness with safety-first approach.
            </p>
            <p className="text-sm text-mist-500">
              No judgement, ever.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sunrise-200">Product</h4>
            <ul className="space-y-3 text-mist-400">
              <li>
                <Link href="/companions" className="hover:text-sunrise-200 transition-colors">
                  Meet Companions
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-sunrise-200 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-sunrise-200 transition-colors">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-sunrise-200 transition-colors">
                  Safety
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sunrise-200">Support</h4>
            <ul className="space-y-3 text-mist-400">
              <li>
                <Link href="/help" className="hover:text-sunrise-200 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-sunrise-200 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/safety#crisis-resources" className="hover:text-sunrise-200 transition-colors">
                  Crisis Resources
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-sunrise-200 transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sunrise-200">Legal</h4>
            <ul className="space-y-3 text-mist-400">
              <li>
                <Link href="/terms" className="hover:text-sunrise-200 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-sunrise-200 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/acceptable-use" className="hover:text-sunrise-200 transition-colors">
                  Acceptable Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Crisis Resources Banner */}
        <div className="mt-12 pt-8 border-t border-charcoal-800">
          <div className="bg-peach-900/20 border border-peach-700/30 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-peach-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-peach-200 mb-2">
                  Need Immediate Crisis Support?
                </h3>
                <p className="text-peach-100 mb-4">
                  If you're experiencing a mental health crisis or having thoughts of self-harm, please contact these resources immediately:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-peach-200 font-semibold mb-2">Emergency Services:</p>
                    <ul className="space-y-1 text-sm text-peach-100">
                      <li><strong>999:</strong> Emergency services</li>
                      <li><strong>Samaritans:</strong> 116 123 (free, 24/7)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-peach-200 font-semibold mb-2">Crisis Support:</p>
                    <ul className="space-y-1 text-sm text-peach-100">
                      <li><strong>NHS 111:</strong> Non-emergency support</li>
                      <li><strong>Text SHOUT:</strong> 85258</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-charcoal-800 text-center text-mist-500">
          <p>&copy; 2024 PositiveNRG. All rights reserved. Built with empathy and care.</p>
        </div>
      </div>
    </footer>
  );
}
