import { Link } from "@remix-run/react";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export default function SubscriptionCancel() {
  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      <section className="py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center">
            <div className="w-16 h-16 bg-peach-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-peach-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="heading-md mb-4 text-charcoal-900">
              Payment Canceled
            </h2>
            <p className="text-body text-charcoal-700 mb-6">
              Your payment was canceled. No charges were made.
            </p>
            
            <div className="space-y-3">
              <Link to="/pricing" className="btn-primary w-full">
                View Plans Again
              </Link>
              <Link to="/dashboard" className="btn-secondary w-full">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

