import { Link } from "@remix-run/react";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

const faqCategories = [
  {
    title: "Getting Started",
    questions: [
      {
        question: "How do I create an account?",
        answer: "Click the 'Get Started' button on our homepage, enter your email and create a password. You'll receive a confirmation email to verify your account."
      },
      {
        question: "Is there a free trial?",
        answer: "Yes! All our plans come with a 7-day free trial. No payment required upfront, and you can cancel anytime during the trial period."
      },
      {
        question: "How do I choose the right companion?",
        answer: "Browse our companions page to see their personalities and specialties. You can try different companions to see which one feels right for you. Each companion has their own unique approach to support."
      },
      {
        question: "Can I change companions later?",
        answer: "Absolutely! You can switch between companions at any time. Each companion will remember your conversations with them individually."
      }
    ]
  },
  {
    title: "Using the Platform",
    questions: [
      {
        question: "How do I start a conversation?",
        answer: "Simply click on a companion from your dashboard or the companions page, and start typing your message. There's no pressure - you can share as much or as little as you feel comfortable with."
      },
      {
        question: "Are my conversations saved?",
        answer: "Yes, your conversations are saved so your companion can remember your previous chats and provide more personalized support over time. You can delete your conversation history at any time."
      },
      {
        question: "How often can I message my companion?",
        answer: "This depends on your subscription plan. Starter plans allow 50 messages per day, while higher tiers offer more. Check your plan details for specific limits."
      },
      {
        question: "What if I don't like a companion's response?",
        answer: "You can always ask your companion to clarify or approach the topic differently. They're designed to be understanding and will adapt to your communication style."
      }
    ]
  },
  {
    title: "Safety & Privacy",
    questions: [
      {
        question: "Is my data secure?",
        answer: "Yes, we use end-to-end encryption to protect your conversations. Your data is never shared with third parties, and we follow strict GDPR guidelines for data protection."
      },
      {
        question: "What if I'm in crisis?",
        answer: "If you're experiencing a mental health crisis, please contact emergency services (999) or Samaritans (116 123) immediately. PositiveNRG is not a replacement for emergency mental health care."
      },
      {
        question: "Can I delete my account?",
        answer: "Yes, you can delete your account and all associated data at any time from your account settings. This action is permanent and cannot be undone."
      },
      {
        question: "Do you monitor conversations?",
        answer: "We use AI-powered safety systems to ensure conversations remain supportive and helpful. Our system can detect crisis situations and provide appropriate resources, but human staff do not read your private conversations."
      }
    ]
  },
  {
    title: "Billing & Subscriptions",
    questions: [
      {
        question: "How does billing work?",
        answer: "We offer monthly and annual subscription plans. You can upgrade, downgrade, or cancel your subscription at any time from your account settings."
      },
      {
        question: "Can I get a refund?",
        answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team within 30 days for a full refund."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, PayPal, and other secure payment methods. All payments are processed securely through our payment partners."
      },
      {
        question: "What happens if I exceed my message limit?",
        answer: "If you consistently need more messages than your plan allows, we recommend upgrading to a higher tier. You can also purchase additional message packs if needed."
      }
    ]
  }
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-xl mb-8">
            Help Center
          </h1>
          <p className="text-body max-w-3xl mx-auto mb-8">
            Find answers to common questions, learn how to get the most out of PositiveNRG, 
            and get support when you need it.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help topics..."
                className="input pr-12"
              />
              <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-sunrise-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-6">Quick Help Topics</h2>
            <p className="text-body">
              Jump to the most common help topics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="#getting-started" className="card text-center hover:shadow-warm transition-all duration-300">
              <div className="w-12 h-12 bg-sunrise-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-charcoal-900 mb-2">Getting Started</h3>
              <p className="text-sm text-charcoal-600">Account setup and first steps</p>
            </Link>

            <Link to="#companions" className="card text-center hover:shadow-warm transition-all duration-300">
              <div className="w-12 h-12 bg-pastel-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-charcoal-900 mb-2">Companions</h3>
              <p className="text-sm text-charcoal-600">Understanding AI companions</p>
            </Link>

            <Link to="#safety" className="card text-center hover:shadow-warm transition-all duration-300">
              <div className="w-12 h-12 bg-warm-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-charcoal-900 mb-2">Safety & Privacy</h3>
              <p className="text-sm text-charcoal-600">Data protection and safety</p>
            </Link>

            <Link to="#billing" className="card text-center hover:shadow-warm transition-all duration-300">
              <div className="w-12 h-12 bg-peach-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="font-semibold text-charcoal-900 mb-2">Billing</h3>
              <p className="text-sm text-charcoal-600">Subscriptions and payments</p>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-6">Frequently Asked Questions</h2>
            <p className="text-body">
              Browse our comprehensive FAQ to find answers to common questions
            </p>
          </div>

          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} id={category.title.toLowerCase().replace(/\s+/g, '-')} className="mb-12">
              <h3 className="heading-md mb-6 text-charcoal-900">{category.title}</h3>
              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => (
                  <div key={faqIndex} className="card">
                    <h4 className="font-semibold text-charcoal-900 mb-3">{faq.question}</h4>
                    <p className="text-body">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Getting Started Guide */}
      <section className="py-20 bg-sunrise-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-6">Getting Started Guide</h2>
            <p className="text-body">
              New to PositiveNRG? Follow this step-by-step guide to get the most out of your experience.
            </p>
          </div>

          <div className="space-y-8">
            <div className="card">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-sunrise-gradient rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                  <span className="text-sm font-bold text-charcoal-900">1</span>
                </div>
                <div>
                  <h3 className="heading-md mb-3">Create Your Account</h3>
                  <p className="text-body mb-4">
                    Sign up with your email address and create a secure password. 
                    You'll receive a confirmation email to verify your account.
                  </p>
                  <Link to="/register" className="btn-primary">
                    Sign Up Now
                  </Link>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-pastel-gradient rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                  <span className="text-sm font-bold text-charcoal-900">2</span>
                </div>
                <div>
                  <h3 className="heading-md mb-3">Choose Your Companion</h3>
                  <p className="text-body mb-4">
                    Browse our collection of AI companions and pick one that feels right for you. 
                    Each has their own unique personality and approach to support.
                  </p>
                  <Link to="/companions" className="btn-primary">
                    Meet Companions
                  </Link>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-warm-gradient rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                  <span className="text-sm font-bold text-charcoal-900">3</span>
                </div>
                <div>
                  <h3 className="heading-md mb-3">Start Your First Conversation</h3>
                  <p className="text-body mb-4">
                    Begin chatting with your chosen companion. Share what's on your mind, 
                    ask for advice, or simply have a friendly conversation.
                  </p>
                  <p className="text-sm text-charcoal-600">
                    Remember: There's no pressure to share anything you're not comfortable with. 
                    Your companion is here to listen and support you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-6">Still Need Help?</h2>
          <p className="text-body mb-8">
            Can't find what you're looking for? Our support team is here to help you.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card text-center">
              <div className="w-12 h-12 bg-sunrise-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-charcoal-900 mb-2">Email Support</h3>
              <p className="text-body mb-4">
                Send us a message and we'll get back to you within 24 hours.
              </p>
              <Link to="/contact" className="btn-primary">
                Contact Us
              </Link>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-pastel-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-charcoal-900 mb-2">Live Chat</h3>
              <p className="text-body mb-4">
                Chat with our support team in real-time during business hours.
              </p>
              <button className="btn-secondary" disabled>
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
