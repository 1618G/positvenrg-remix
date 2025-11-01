import { Link } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if user is logged in
  let user = null;
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];
  
  if (token) {
    const { verifyUserSession, getUserById } = await import("~/lib/auth.server");
    const session = verifyUserSession(token);
    if (session) {
      user = await getUserById(session.userId);
    }
  }

  return json({ user });
}

const plans = [
  {
    name: 'Free',
    price: '£0',
    period: 'month',
    description: 'Try our AI companions with limited access',
    interactions: '10 conversations',
    features: [
      '10 free conversations',
      'Access to basic companions',
      'Basic safety features',
      'Email support'
    ],
    planType: null,
    popular: false,
    color: 'pastel'
  },
  {
    name: 'Starter',
    price: '£10',
    period: 'month',
    description: 'Perfect for regular use',
    interactions: '1,000 interactions',
    features: [
      '1,000 interactions per month',
      'Access to all basic companions',
      'Message history saved',
      'Email support',
      'Personalized responses'
    ],
    planType: 'STARTER',
    popular: false,
    color: 'sunrise'
  },
  {
    name: 'Professional',
    price: '£20',
    period: 'month',
    description: 'For power users and frequent conversations',
    interactions: '2,500 interactions',
    features: [
      '2,500 interactions per month',
      'Access to all companions',
      'Priority support',
      'Advanced personalization',
      'Long-term memory',
      'Conversation summaries'
    ],
    planType: 'PROFESSIONAL',
    popular: true,
    color: 'peach'
  },
  {
    name: 'Premium',
    price: '£50',
    period: 'month',
    description: 'Unlimited access for unlimited support',
    interactions: 'Unlimited',
    features: [
      'Unlimited interactions',
      'All premium companions',
      '24/7 priority support',
      'Advanced AI features',
      'Custom companion training',
      'Advanced analytics',
      'API access (coming soon)'
    ],
    planType: 'PREMIUM',
    popular: false,
    color: 'warm'
  }
];

export default function PricingPage() {
  const { user } = useLoaderData<typeof loader>();

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
            Start with free conversations or choose a subscription plan that fits your needs. 
            All paid plans include a free trial period.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-charcoal-600">
            <svg className="w-5 h-5 text-pastel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Cancel anytime</span>
            <svg className="w-5 h-5 text-pastel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>No setup fees</span>
            <svg className="w-5 h-5 text-pastel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Secure payments</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-sunrise-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`card relative ${plan.popular ? 'ring-2 ring-peach-200 shadow-warm scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-peach-gradient text-charcoal-900 text-sm font-semibold px-4 py-2 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="heading-md mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-charcoal-900">{plan.price}</span>
                    {plan.price !== '£0' && (
                      <span className="text-charcoal-600">/{plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-sunrise-600 mb-2">{plan.interactions}</p>
                  <p className="text-body text-charcoal-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-charcoal-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.planType ? (
                  user ? (
                    <Link 
                      to={`/checkout/${plan.planType.toLowerCase()}`}
                      className={`w-full btn-primary block text-center`}
                    >
                      Subscribe Now
                    </Link>
                  ) : (
                    <Link 
                      to="/register"
                      className={`w-full btn-primary block text-center`}
                    >
                      Get Started
                    </Link>
                  )
                ) : (
                  <Link 
                    to="/companions"
                    className={`w-full btn-secondary block text-center`}
                  >
                    Try Free
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-lg text-center mb-12">Compare Plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-charcoal-200">
                  <th className="text-left py-4 px-4 font-semibold text-charcoal-900">Features</th>
                  <th className="text-center py-4 px-4 font-semibold text-charcoal-900">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-charcoal-900">Starter</th>
                  <th className="text-center py-4 px-4 font-semibold text-charcoal-900">Professional</th>
                  <th className="text-center py-4 px-4 font-semibold text-charcoal-900">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                <tr>
                  <td className="py-4 px-4 font-medium text-charcoal-900">Monthly Interactions</td>
                  <td className="py-4 px-4 text-center text-charcoal-600">10</td>
                  <td className="py-4 px-4 text-center text-charcoal-600">1,000</td>
                  <td className="py-4 px-4 text-center text-charcoal-600">2,500</td>
                  <td className="py-4 px-4 text-center text-charcoal-600 font-semibold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-charcoal-900">AI Companions</td>
                  <td className="py-4 px-4 text-center">✅</td>
                  <td className="py-4 px-4 text-center">✅</td>
                  <td className="py-4 px-4 text-center">✅</td>
                  <td className="py-4 px-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-charcoal-900">Message History</td>
                  <td className="py-4 px-4 text-center">❌</td>
                  <td className="py-4 px-4 text-center">✅</td>
                  <td className="py-4 px-4 text-center">✅</td>
                  <td className="py-4 px-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-charcoal-900">Personalized Responses</td>
                  <td className="py-4 px-4 text-center">Basic</td>
                  <td className="py-4 px-4 text-center">✅</td>
                  <td className="py-4 px-4 text-center">✅</td>
                  <td className="py-4 px-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-charcoal-900">Support</td>
                  <td className="py-4 px-4 text-center">Email</td>
                  <td className="py-4 px-4 text-center">Email</td>
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
              <h3 className="heading-md mb-3">What counts as an interaction?</h3>
              <p className="text-body">
                An interaction is one complete message exchange - when you send a message and receive a response from your AI companion. 
                This includes both your message and the companion's response as one interaction.
              </p>
            </div>
            
            <div className="card">
              <h3 className="heading-md mb-3">Can I change my plan anytime?</h3>
              <p className="text-body">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any billing differences.
              </p>
            </div>
            
            <div className="card">
              <h3 className="heading-md mb-3">What if I run out of interactions?</h3>
              <p className="text-body">
                You can upgrade to a higher tier at any time to get more interactions. 
                Alternatively, you can wait until your monthly limit resets.
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
            with their AI friends. Start your free conversations today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-lg px-8 py-4">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/register" className="btn-primary text-lg px-8 py-4">
                Get Started Free
              </Link>
            )}
            <Link to="/companions" className="btn-secondary text-lg px-8 py-4">
              Browse Companions
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
