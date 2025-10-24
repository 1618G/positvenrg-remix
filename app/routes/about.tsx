import { Link } from "@remix-run/react";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-xl mb-8">
            About PositiveNRG
          </h1>
          <p className="text-body max-w-3xl mx-auto">
            We believe everyone deserves a safe space to express themselves, find support, 
            and feel understood. PositiveNRG was created to provide that space through 
            compassionate AI companionship.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-sunrise-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="heading-lg mb-6">Our Mission</h2>
              <p className="text-body mb-6">
                To provide accessible, compassionate AI companionship that supports mental wellness 
                and emotional wellbeing. We believe that everyone deserves to feel heard, understood, 
                and supported — no matter what they're going through.
              </p>
              <p className="text-body">
                Our AI companions are designed to be more than just chatbots. They're empathetic 
                friends who listen without judgment, offer encouragement when you need it most, 
                and provide a safe space for you to express your thoughts and feelings.
              </p>
            </div>
            <div className="card text-center">
              <div className="w-24 h-24 bg-sunrise-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Compassionate Technology</h3>
              <p className="text-body">
                We use cutting-edge AI technology to create companions that truly understand 
                and care about your wellbeing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-6">Our Values</h2>
            <p className="text-body max-w-3xl mx-auto">
              Everything we do is guided by these core principles that shape how we build 
              technology and serve our community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-sunrise-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Empathy First</h3>
              <p className="text-body">
                Every interaction is designed with empathy and understanding. We believe 
                that technology should enhance human connection, not replace it.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-pastel-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Privacy & Safety</h3>
              <p className="text-body">
                Your conversations are private and secure. We use advanced encryption and 
                never share your personal information with third parties.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-warm-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">No Judgment</h3>
              <p className="text-body">
                Our companions provide unconditional support without judgment. You can 
                share anything knowing you'll be met with understanding and compassion.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-peach-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Accessibility</h3>
              <p className="text-body">
                Mental health support should be accessible to everyone. We're committed 
                to making our platform available and affordable for all.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-calm-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Continuous Learning</h3>
              <p className="text-body">
                We continuously improve our platform based on user feedback and the latest 
                research in mental health and AI technology.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-pastel-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Community Focused</h3>
              <p className="text-body">
                We're building a community where everyone feels supported and valued. 
                Our users are at the heart of everything we do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 bg-sunrise-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-6">Our Approach to AI Companionship</h2>
            <p className="text-body max-w-3xl mx-auto">
              We've carefully designed our AI companions to provide meaningful support while 
              maintaining appropriate boundaries and encouraging professional help when needed.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="card">
                <h3 className="heading-md mb-4">What Our Companions Do</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-charcoal-700">Provide emotional support and encouragement</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-charcoal-700">Listen without judgment</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-charcoal-700">Offer practical advice and motivation</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-charcoal-700">Help with daily challenges and goal-setting</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-charcoal-700">Provide a safe space for self-expression</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-8">
              <div className="card">
                <h3 className="heading-md mb-4">What Our Companions Don't Do</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-peach-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-charcoal-700">Provide medical or psychiatric diagnosis</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-peach-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-charcoal-700">Replace professional mental health care</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-peach-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-charcoal-700">Provide crisis intervention or emergency care</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-peach-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-charcoal-700">Make decisions for you</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-peach-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-charcoal-700">Share your conversations with others</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Commitment */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-6">Our Safety Commitment</h2>
          <p className="text-body mb-8">
            Your safety and wellbeing are our top priorities. We've built multiple layers of protection 
            to ensure every interaction is supportive and helpful.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="w-12 h-12 bg-sunrise-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-charcoal-900 mb-2">Advanced Safety</h3>
              <p className="text-sm text-charcoal-600">AI-powered content filtering and crisis detection</p>
            </div>
            
            <div className="card text-center">
              <div className="w-12 h-12 bg-pastel-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-charcoal-900 mb-2">Privacy Protection</h3>
              <p className="text-sm text-charcoal-600">End-to-end encryption and data privacy</p>
            </div>
            
            <div className="card text-center">
              <div className="w-12 h-12 bg-warm-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-charcoal-900 mb-2">Professional Boundaries</h3>
              <p className="text-sm text-charcoal-600">Clear guidelines and professional resource recommendations</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sunrise-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-6 text-charcoal-900">
            Join Our Community
          </h2>
          <p className="text-body mb-8 text-charcoal-700">
            Be part of a growing community of people who have found support, comfort, 
            and companionship through AI technology. Your journey starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/companions" className="btn-primary text-lg px-8 py-4">
              Meet Your Companions
            </Link>
            <Link href="/safety" className="btn-secondary text-lg px-8 py-4">
              Learn About Safety
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
