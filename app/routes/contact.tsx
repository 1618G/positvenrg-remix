import { Form } from "@remix-run/react";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-xl mb-8">
            Get in Touch
          </h1>
          <p className="text-body max-w-3xl mx-auto">
            We're here to help! Whether you have questions about PositiveNRG, need technical support, 
            or want to share feedback, we'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 bg-sunrise-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="card">
              <h2 className="heading-lg mb-6">Send us a message</h2>
              <Form method="post" className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-charcoal-900 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="input"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-charcoal-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="input"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-charcoal-900 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="input"
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Question</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing & Subscription</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="safety">Safety Concerns</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-charcoal-900 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    className="input"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button type="submit" className="btn-primary w-full">
                  Send Message
                </button>
              </Form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="heading-lg mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-sunrise-gradient rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal-900 mb-1">Email Support</h3>
                      <p className="text-charcoal-600 mb-2">support@positivenrg.com</p>
                      <p className="text-sm text-charcoal-500">We typically respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-pastel-gradient rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal-900 mb-1">Response Time</h3>
                      <p className="text-charcoal-600 mb-2">24-48 hours for general inquiries</p>
                      <p className="text-sm text-charcoal-500">Urgent safety concerns: Within 4 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-warm-gradient rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal-900 mb-1">Help Center</h3>
                      <p className="text-charcoal-600 mb-2">Check our FAQ for quick answers</p>
                      <p className="text-sm text-charcoal-500">Most common questions answered instantly</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Link */}
              <div className="card">
                <h3 className="heading-md mb-4">Quick Help</h3>
                <p className="text-body mb-4">
                  Before reaching out, you might find the answer to your question in our Help Center.
                </p>
                <a href="/help" className="btn-secondary w-full">
                  Visit Help Center
                </a>
              </div>

              {/* Safety Notice */}
              <div className="safe-space-banner">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="icon-md text-pastel-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-charcoal-900 mb-2">
                      Crisis Support
                    </h3>
                    <p className="text-body">
                      If you're experiencing a mental health crisis, please contact emergency services 
                      or crisis helplines immediately. PositiveNRG is not a replacement for emergency care.
                    </p>
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-charcoal-700">Emergency: 999</p>
                      <p className="text-sm font-semibold text-charcoal-700">Samaritans: 116 123</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-6">Frequently Asked Questions</h2>
            <p className="text-body">
              Here are some of the most common questions we receive. 
              For more detailed answers, visit our Help Center.
            </p>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="heading-md mb-3">How do I get started with PositiveNRG?</h3>
              <p className="text-body">
                Simply sign up for a free account, choose a companion that feels right for you, 
                and start chatting! Your first conversation is completely free.
              </p>
            </div>

            <div className="card">
              <h3 className="heading-md mb-3">Is my conversation data private?</h3>
              <p className="text-body">
                Yes! All your conversations are encrypted and private. We never share your data 
                with third parties, and you have complete control over your information.
              </p>
            </div>

            <div className="card">
              <h3 className="heading-md mb-3">Can I switch between different companions?</h3>
              <p className="text-body">
                Absolutely! You can chat with any of our companions at any time. Each companion 
                will remember your conversations with them individually.
              </p>
            </div>

            <div className="card">
              <h3 className="heading-md mb-3">What if I need professional mental health support?</h3>
              <p className="text-body">
                Our AI companions are designed to provide emotional support and companionship, 
                not professional mental health care. We always encourage seeking professional 
                help when needed and can provide resources to help you find appropriate care.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
