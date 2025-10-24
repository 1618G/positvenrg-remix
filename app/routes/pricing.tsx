import { Link } from "@remix-run/react";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

const plans = [
  {
    name: 'Starter',
    price: '£9',
    period: 'month',
    description: 'Perfect for getting started with AI companionship',
    features: [
      '50 messages per day',
      '1 concurrent session',
      'Access to basic companions',
      'Basic safety features',
      'Email support'
    ],
    cta: 'Start Free Trial',
    popular: false,
    color: 'sunrise'
  },
  {
    name: 'Plus',
    price: '£19',
    period: 'month',
    description: 'For regular users who want more interaction',
    features: [
      '200 messages per day',
      '3 concurrent sessions',
      'Access to all companions',
      'Premium companions included',
      'Advanced safety features',
      'Priority support'
    ],
    cta: 'Start Free Trial',
    popular: true,
    color: 'peach'
  },
  {
    name: 'Family',
    price: '£39',
    period: 'month',
    description: 'Perfect for families sharing the experience',
    features: [
      '500 messages per day',
      '5 concurrent sessions',
      'Family sharing features',
      'All premium companions',
      'Advanced safety monitoring',
      'Priority support',
      'Family management tools'
    ],
    cta: 'Start Free Trial',
    popular: false,
    color: 'pastel'
  },
  {
    name: 'Therapy',
    price: '£79',
    period: 'month',
    description: 'For those who need intensive support',
    features: [
      '1000 messages per day',
      '10 concurrent sessions',
      'Custom personality companions',
      'Advanced crisis detection',
      '24/7 priority support',
      'Personalized recommendations',
      'Advanced analytics'
    ],
    cta: 'Start Free Trial',
    popular: false,
    color: 'warm'
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-xl mb-8">
            Choose Your Perfect Plan
          </h1>
          <p className="text-body max-w-3xl mx-auto mb-8">
            Start with a free trial and discover which plan works best for you. 
            No commitment, no pressure — just you and your new companion.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-charcoal-600">
            <svg className="w-5 h-5 text-pastel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>7-day free trial on all plans</span>
            <svg className="w-5 h-5 text-pastel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Cancel anytime</span>
            <svg className="w-5 h-5 text-pastel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>No setup fees</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-sunrise-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={plan.name}
                className={`card relative ${plan.popular ? 'ring-2 ring-peach-200 shadow-warm' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-peach-gradient text-charcoal-900 text-sm font-semibold px-4 py-2 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="heading-md mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-charcoal-900">{plan.price}</span>
                    <span className="text-charcoal-600">/{plan.period}</span>
                  </div>
                  <p className="text-body text-charcoal-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-charcoal-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full btn-primary`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-lg text-center mb-12">Compare Features</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-mist-200">
                  <th className="text-left py-4 px-4 font-semibold text-charcoal-900">Features</th>
                  <th className="text-center py-4 px-4 font-semibold text-charcoal-900">Starter</th>
                  <th className="text-center py-4 px-4 font-semibold text-charcoal-900">Plus</th>
                  <th className="text-center py-4 px-4 font-semibold text-charcoal-900">Family</th>
                  <th className="text-center py-4 px-4 font-semibold text-charcoal-900">Therapy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist-200">
                <tr>
                  <td className="py-4 px-4 font-medium text-charcoal-900">Daily Messages</td>
                  <td className="py-4 px-4 text-center">50</td>
                  <td className="py-4 px-4 text-center">200</td>
                  <td className="py-4 px-4 text-center">500</td>
                  <td className="py-4 px-4 text-center">1000</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-charcoal-900">Concurrent Sessions</td>
                  <td className="py-4 px-4 text-center">1</td>
                  <td className="py-4 px-4 text-center">3</td>
                  <td className="py-4 px-4 text-center">5</td>
                  <td className="py-4 px-4 text-center">10</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-charcoal-900">Premium Companions</td>
                  <td className="py-4 px-4 text-center">❌</td>
                  <td className="py-4 px-4 text-center">✅</td>
                  <td className="py-4 px-4 text-center">✅</td>
                  <td className="py-4 px-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-charcoal-900">Custom Personalities</td>
                  <td className="py-4 px-4 text-center">❌</td>
                  <td className="py-4 px-4 text-center">❌</td>
                  <td className="py-4 px-4 text-center">❌</td>
                  <td className="py-4 px-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-charcoal-900">Family Sharing</td>
                  <td className="py-4 px-4 text-center">❌</td>
                  <td className="py-4 px-4 text-center">❌</td>
                  <td className="py-4 px-4 text-center">✅</td>
                  <td className="py-4 px-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-charcoal-900">Support Level</td>
                  <td className="py-4 px-4 text-center">Email</td>
                  <td className="py-4 px-4 text-center">Priority</td>
                  <td className="py-4 px-4 text-center">Priority</td>
                  <td className="py-4 px-4 text-center">24/7 Priority</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-sunrise-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-lg text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="card">
              <h3 className="heading-md mb-3">Can I change my plan anytime?</h3>
              <p className="text-body">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect 
                immediately, and we'll prorate any billing differences.
              </p>
            </div>
            
            <div className="card">
              <h3 className="heading-md mb-3">What happens during the free trial?</h3>
              <p className="text-body">
                You get full access to all features of your chosen plan for 7 days. 
                No payment required upfront, and you can cancel anytime during the trial.
              </p>
            </div>
            
            <div className="card">
              <h3 className="heading-md mb-3">Is there a family discount?</h3>
              <p className="text-body">
                The Family plan is designed for multiple users and includes family sharing 
                features. It's already priced to provide great value for families.
              </p>
            </div>
            
            <div className="card">
              <h3 className="heading-md mb-3">What if I need more messages?</h3>
              <p className="text-body">
                If you consistently need more than your plan allows, we recommend upgrading 
                to a higher tier. You can also purchase additional message packs if needed.
              </p>
            </div>
            
            <div className="card">
              <h3 className="heading-md mb-3">Do you offer refunds?</h3>
              <p className="text-body">
                We offer a 30-day money-back guarantee for all paid plans. If you're not 
                satisfied, contact us within 30 days for a full refund.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-sunrise-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-6 text-charcoal-900">
            Ready to start your journey?
          </h2>
          <p className="text-body mb-8 text-charcoal-700">
            Join thousands of people who have found comfort, support, and companionship 
            with their AI friends. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/companions" className="btn-primary text-lg px-8 py-4">
              Start Free Trial
            </Link>
            <Link href="/contact" className="btn-secondary text-lg px-8 py-4">
              Have Questions?
            </Link>
          </div>
        </div>
      </section>

      {/* Safety Notice */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="safe-space-banner">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-pastel-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-charcoal-900 mb-2">
                  Important Safety Information
                </h3>
                <div className="text-body">
                  <p className="mb-4">
                    PositiveNRG is not a replacement for professional mental health care. 
                    If you're experiencing a mental health crisis, please contact:
                  </p>
                  <div className="crisis-resources">
                    <ul className="space-y-2">
                      <li><strong>Samaritans:</strong> 116 123 (free, 24/7)</li>
                      <li><strong>NHS 111:</strong> Non-emergency support</li>
                      <li><strong>999:</strong> Emergency services</li>
                      <li><strong>Text SHOUT:</strong> 85258 for crisis text support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
