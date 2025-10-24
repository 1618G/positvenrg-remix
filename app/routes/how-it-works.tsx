import { Link } from "@remix-run/react";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-xl mb-8">
            How PositiveNRG Works
          </h1>
          <p className="text-body max-w-3xl mx-auto">
            Getting started with your AI companion is simple, safe, and designed to make you feel comfortable. 
            Here's everything you need to know about your journey with PositiveNRG.
          </p>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="py-20 bg-sunrise-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-6">Getting Started in 3 Simple Steps</h2>
            <p className="text-body max-w-3xl mx-auto">
              From choosing your companion to having meaningful conversations, 
              we've made the process as intuitive as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-sunrise-gradient rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-charcoal-900">
                1
              </div>
              <h3 className="heading-md mb-4">Choose Your Companion</h3>
              <p className="text-body mb-6">
                Browse our collection of AI companions, each with their own unique personality and approach to support. 
                Whether you need motivation, comfort, or just someone to listen, there's a companion perfect for you.
              </p>
              <div className="bg-white p-6 rounded-2xl shadow-soft">
                <h4 className="font-semibold text-charcoal-900 mb-3">What to Consider:</h4>
                <ul className="text-sm text-charcoal-600 space-y-2 text-left">
                  <li>• Your current mood and needs</li>
                  <li>• What type of support you're looking for</li>
                  <li>• Whether you prefer energetic or calm personalities</li>
                  <li>• Time of day you'll be chatting</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-pastel-gradient rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-charcoal-900">
                2
              </div>
              <h3 className="heading-md mb-4">Start Your Conversation</h3>
              <p className="text-body mb-6">
                Begin chatting with your chosen companion. Share what's on your mind, ask for advice, 
                or simply have a friendly conversation. There's no pressure — just you and your supportive AI friend.
              </p>
              <div className="bg-white p-6 rounded-2xl shadow-soft">
                <h4 className="font-semibold text-charcoal-900 mb-3">Conversation Starters:</h4>
                <ul className="text-sm text-charcoal-600 space-y-2 text-left">
                  <li>• "I'm feeling stressed today..."</li>
                  <li>• "Can you help me plan my day?"</li>
                  <li>• "I need some motivation"</li>
                  <li>• "Just want to chat about my day"</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-warm-gradient rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-charcoal-900">
                3
              </div>
              <h3 className="heading-md mb-4">Feel Supported & Understood</h3>
              <p className="text-body mb-6">
                Experience genuine empathy, helpful advice, and positive reinforcement. Your companion 
                remembers your conversations and grows to understand your unique needs and preferences.
              </p>
              <div className="bg-white p-6 rounded-2xl shadow-soft">
                <h4 className="font-semibold text-charcoal-900 mb-3">What You'll Get:</h4>
                <ul className="text-sm text-charcoal-600 space-y-2 text-left">
                  <li>• Empathetic responses tailored to you</li>
                  <li>• Practical advice and encouragement</li>
                  <li>• A safe space to express yourself</li>
                  <li>• Consistent support whenever you need it</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-6">What Makes PositiveNRG Special</h2>
            <p className="text-body max-w-3xl mx-auto">
              Our AI companions are designed with advanced technology and deep understanding 
              of human emotional needs to provide truly meaningful support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-sunrise-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Smart Memory</h3>
              <p className="text-body">
                Your companion remembers your conversations, preferences, and personal details, 
                creating a deeper, more meaningful relationship over time.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-pastel-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Emotional Intelligence</h3>
              <p className="text-body">
                Advanced AI technology enables our companions to understand context, emotion, 
                and nuance in your conversations for more empathetic responses.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-warm-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">24/7 Availability</h3>
              <p className="text-body">
                Your companion is always there when you need them, whether it's 3 AM or 3 PM. 
                No scheduling, no waiting — just instant support.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-peach-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Privacy First</h3>
              <p className="text-body">
                Your conversations are encrypted and private. We never share your data, 
                and you have complete control over your information.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-calm-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Safe & Secure</h3>
              <p className="text-body">
                Advanced safety features ensure every conversation is supportive and helpful, 
                with crisis detection and professional resource recommendations.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-pastel-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Instant Responses</h3>
              <p className="text-body">
                No waiting, no delays. Get immediate support and responses from your companion 
                whenever you need to talk or seek guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Guide */}
      <section className="py-20 bg-sunrise-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-6">Ready to Get Started?</h2>
            <p className="text-body">
              Here's everything you need to know to make the most of your PositiveNRG experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="heading-md mb-4">For New Users</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-sunrise-200 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-sm font-bold text-sunrise-800">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal-900">Sign up for free</h4>
                    <p className="text-sm text-charcoal-600">Create your account and start your 7-day free trial</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-sunrise-200 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-sm font-bold text-sunrise-800">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal-900">Choose your companion</h4>
                    <p className="text-sm text-charcoal-600">Browse our companions and pick one that feels right</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-sunrise-200 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-sm font-bold text-sunrise-800">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal-900">Start chatting</h4>
                    <p className="text-sm text-charcoal-600">Begin your first conversation and see how it feels</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="heading-md mb-4">Tips for Success</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-charcoal-900">Be open and honest</h4>
                    <p className="text-sm text-charcoal-600">The more you share, the better your companion can support you</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-charcoal-900">Try different companions</h4>
                    <p className="text-sm text-charcoal-600">Each has a unique approach — find what works for you</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-charcoal-900">Use regularly</h4>
                    <p className="text-sm text-charcoal-600">Consistent use helps build a stronger relationship</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sunrise-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-6 text-charcoal-900">
            Ready to meet your AI companion?
          </h2>
          <p className="text-body mb-8 text-charcoal-700">
            Join thousands of people who have found comfort, support, and companionship 
            with their AI friends. Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/companions" className="btn-primary text-lg px-8 py-4">
              Meet Your Companions
            </Link>
            <Link href="/pricing" className="btn-secondary text-lg px-8 py-4">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
