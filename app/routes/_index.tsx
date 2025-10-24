import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/lib/db.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function loader({ request }: LoaderFunctionArgs) {
  const companions = await db.companion.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return json({ companions });
}

export default function Index() {
  const { companions } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-cosmic-50">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 hero-gradient opacity-10"></div>
        <div className="absolute top-20 right-10 w-32 h-32 bg-electric-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-teal-200 rounded-full blur-2xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center fade-in">
            <h1 className="heading-xl mb-8">
              No Judgement Ever —<br />
              <span className="gradient-text">Find a Friend, Find Your PositiveNRG</span>
            </h1>
            <p className="text-body mb-12 max-w-4xl mx-auto">
              Interactive AI companions that listen, support, and uplift — anytime you need them. 
              Whether it's sharing your thoughts, calming your mind, or just chatting, we're here — without judgement.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/companions" className="btn-primary text-lg px-8 py-4">
                Meet PositiveNRG
              </Link>
              <Link href="/companions" className="btn-secondary text-lg px-8 py-4">
                Browse Companions
              </Link>
            </div>

            {/* Character Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {companions.slice(0, 4).map((companion, index) => (
                <div key={companion.id} className="card-character text-center slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="avatar-frame mx-auto mb-4">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <span className="text-2xl">{companion.avatar}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-charcoal-900 mb-2">{companion.name}</h3>
                  <p className="text-sm text-mist-600">Your daily companion</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Why PositiveNRG Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-6">You deserve a safe space</h2>
            <p className="text-body max-w-3xl mx-auto">
              Our avatars are built to listen, encourage, and keep you company. 
              Whether it's sharing your thoughts, calming your mind, or just chatting, we're here — without judgement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-sunrise-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Safe Conversations</h3>
              <p className="text-body">
                Advanced moderation and crisis detection ensure every conversation is safe and supportive.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-pastel-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Privacy First</h3>
              <p className="text-body">
                Your conversations are encrypted and never shared. GDPR compliant with full data control.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-warm-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Always Available</h3>
              <p className="text-body">
                24/7 support from AI companions who understand and care about your wellbeing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-sunrise-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-6">How It Works</h2>
            <p className="text-body max-w-3xl mx-auto">
              Getting started with your AI companion is simple, safe, and designed to make you feel comfortable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-sunrise-gradient rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-charcoal-900">
                1
              </div>
              <h3 className="heading-md mb-4">Pick a Companion</h3>
              <p className="text-body">
                Find the personality that feels right for you. Each companion has their own unique way of supporting you.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-pastel-gradient rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-charcoal-900">
                2
              </div>
              <h3 className="heading-md mb-4">Start Talking</h3>
              <p className="text-body">
                No judgement, no pressure, just you and them. Share what's on your mind in a safe, supportive space.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-warm-gradient rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-charcoal-900">
                3
              </div>
              <h3 className="heading-md mb-4">Feel Better</h3>
              <p className="text-body">
                A daily dose of positivity at your fingertips. Your companion is always here to listen and support you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Notice */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="safe-space-banner">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="icon-md text-pastel-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-charcoal-900 mb-2">
                  Your Safe Space is Waiting
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

      {/* Final CTA */}
      <section className="py-20 bg-sunrise-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-6 text-charcoal-900">Your safe space is waiting</h2>
          <p className="text-body mb-8 text-charcoal-700">
            Join thousands of people who have found comfort, support, and companionship with their AI friends.
          </p>
          <Link href="/pricing" className="btn-primary text-lg px-8 py-4">
            Subscribe Now — No Judgement Ever
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
