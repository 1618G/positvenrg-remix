import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-xl mb-8">
            Your Safety is Our Priority
          </h1>
          <p className="text-body max-w-3xl mx-auto">
            We've built PositiveNRG with safety at its core. Every conversation is designed 
            to be supportive, secure, and helpful — with multiple layers of protection.
          </p>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-20 bg-sunrise-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-6">How We Keep You Safe</h2>
            <p className="text-body max-w-3xl mx-auto">
              Our comprehensive safety system works behind the scenes to ensure every interaction 
              is positive, helpful, and secure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-sunrise-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Advanced Moderation</h3>
              <p className="text-body">
                AI-powered content filtering ensures conversations stay positive and helpful, 
                automatically detecting and preventing harmful content.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-pastel-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Crisis Detection</h3>
              <p className="text-body">
                Our system can identify when someone might be in crisis and immediately 
                provide appropriate resources and support contacts.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-warm-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Real-time Monitoring</h3>
              <p className="text-body">
                Continuous monitoring ensures conversations remain supportive and helpful, 
                with immediate intervention when needed.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-peach-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Empathetic Responses</h3>
              <p className="text-body">
                All AI companions are trained to respond with empathy, understanding, 
                and positivity — never judgment or criticism.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-calm-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Privacy Protection</h3>
              <p className="text-body">
                Your conversations are encrypted and never shared. We follow strict GDPR 
                guidelines and give you full control over your data.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-pastel-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="icon-lg text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
              </div>
              <h3 className="heading-md mb-4">Professional Boundaries</h3>
              <p className="text-body">
                Our AI companions are designed to be supportive friends, not medical professionals. 
                They always encourage seeking professional help when appropriate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Crisis Resources */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-6">Crisis Resources</h2>
            <p className="text-body">
              If you're experiencing a mental health crisis, please contact these resources immediately. 
              PositiveNRG is not a replacement for professional mental health care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="heading-md mb-4 text-peach-800">Emergency Services</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-peach-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl font-bold text-peach-800">999</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal-900">Emergency Services</h4>
                    <p className="text-charcoal-600">For immediate life-threatening emergencies</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-pastel-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg font-bold text-pastel-800">116</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal-900">Samaritans</h4>
                    <p className="text-charcoal-600">116 123 (free, 24/7)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="heading-md mb-4 text-pastel-800">Crisis Support</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-sunrise-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg font-bold text-sunrise-800">111</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal-900">NHS 111</h4>
                    <p className="text-charcoal-600">Non-emergency support</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-warm-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg font-bold text-warm-800">85258</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal-900">Text SHOUT</h4>
                    <p className="text-charcoal-600">Crisis text support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Guidelines */}
      <section className="py-20 bg-sunrise-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-6">Safety Guidelines</h2>
            <p className="text-body">
              Help us maintain a safe environment for everyone by following these guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="heading-md mb-4 text-charcoal-900">Do's</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-charcoal-700">Share your thoughts and feelings openly</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-charcoal-700">Ask for help when you need it</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-charcoal-700">Be respectful and kind</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-pastel-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-charcoal-700">Seek professional help for serious concerns</span>
                </li>
              </ul>
            </div>

            <div className="card">
              <h3 className="heading-md mb-4 text-charcoal-900">Don'ts</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-peach-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-charcoal-700">Share harmful or illegal content</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-peach-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-charcoal-700">Use the platform for medical advice</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-peach-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-charcoal-700">Harass or abuse other users</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-peach-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-charcoal-700">Share personal information of others</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Disclaimer */}
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
                  Important Professional Disclaimer
                </h3>
                <div className="text-body">
                  <p className="mb-4">
                    PositiveNRG is designed to provide emotional support and companionship through AI technology. 
                    It is not a substitute for professional mental health care, therapy, or medical treatment.
                  </p>
                  <p className="mb-4">
                    If you are experiencing a mental health crisis, having thoughts of self-harm, or need immediate 
                    professional help, please contact emergency services or a qualified mental health professional.
                  </p>
                  <p>
                    Our AI companions are here to listen, support, and provide comfort, but they cannot replace 
                    the expertise and care of trained mental health professionals.
                  </p>
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
