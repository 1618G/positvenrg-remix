import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="heading-xl mb-8">Terms of Service</h1>
          <p className="text-body mb-6">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-body">
            These Terms of Service ("Terms") govern your use of PositiveNRG's AI companionship platform. 
            By using our service, you agree to these terms.
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-20 bg-sunrise-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="card">
              <h2 className="heading-lg mb-6">1. Acceptance of Terms</h2>
              <p className="text-body mb-4">
                By accessing or using PositiveNRG ("the Service"), you agree to be bound by these Terms of Service 
                and all applicable laws and regulations. If you do not agree with any of these terms, you are 
                prohibited from using or accessing this service.
              </p>
              <p className="text-body">
                These terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">2. Description of Service</h2>
              <p className="text-body mb-4">
                PositiveNRG provides AI-powered companionship services designed to offer emotional support, 
                encouragement, and a safe space for users to express themselves. Our AI companions are 
                designed to be supportive friends, not medical professionals.
              </p>
              <p className="text-body">
                The Service includes but is not limited to:
              </p>
              <ul className="list-disc list-inside text-body mt-4 space-y-2">
                <li>AI companion chat services</li>
                <li>Emotional support and encouragement</li>
                <li>Safe space for self-expression</li>
                <li>Motivational and goal-setting assistance</li>
                <li>Mindfulness and stress relief guidance</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">3. User Accounts</h2>
              <p className="text-body mb-4">
                To access certain features of the Service, you may be required to create an account. 
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-body mt-4 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">4. Acceptable Use</h2>
              <p className="text-body mb-4">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. 
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-body mt-4 space-y-2">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Share harmful, threatening, or inappropriate content</li>
                <li>Impersonate another person or entity</li>
                <li>Use the Service to harass, abuse, or harm others</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">5. Privacy and Data Protection</h2>
              <p className="text-body mb-4">
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect 
                your information when you use the Service. By using the Service, you agree to the collection 
                and use of information in accordance with our Privacy Policy.
              </p>
              <p className="text-body">
                We implement appropriate security measures to protect your personal information and conversations. 
                However, no method of transmission over the internet is 100% secure.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">6. Subscription and Billing</h2>
              <p className="text-body mb-4">
                Some features of the Service require a paid subscription. By subscribing, you agree to:
              </p>
              <ul className="list-disc list-inside text-body mt-4 space-y-2">
                <li>Pay all fees associated with your subscription</li>
                <li>Provide accurate billing information</li>
                <li>Notify us of any changes to your billing information</li>
                <li>Understand that subscription fees are non-refundable except as required by law</li>
              </ul>
              <p className="text-body mt-4">
                We offer a 30-day money-back guarantee for new subscribers. You may cancel your subscription 
                at any time from your account settings.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">7. Intellectual Property</h2>
              <p className="text-body mb-4">
                The Service and its original content, features, and functionality are owned by PositiveNRG 
                and are protected by international copyright, trademark, patent, trade secret, and other 
                intellectual property laws.
              </p>
              <p className="text-body">
                You may not reproduce, distribute, modify, or create derivative works of the Service without 
                our express written permission.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">8. Disclaimers and Limitations</h2>
              <p className="text-body mb-4">
                <strong>Important:</strong> PositiveNRG is not a replacement for professional mental health care, 
                therapy, or medical treatment. Our AI companions are designed to provide emotional support 
                and companionship, not medical advice or crisis intervention.
              </p>
              <p className="text-body mb-4">
                The Service is provided "as is" without warranties of any kind. We do not guarantee that the 
                Service will be uninterrupted, error-free, or completely secure.
              </p>
              <p className="text-body">
                If you are experiencing a mental health crisis or having thoughts of self-harm, please contact 
                emergency services (999) or Samaritans (116 123) immediately.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">9. Limitation of Liability</h2>
              <p className="text-body">
                To the maximum extent permitted by law, PositiveNRG shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, including but not limited to loss 
                of profits, data, or use, arising out of or relating to your use of the Service.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">10. Termination</h2>
              <p className="text-body mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior 
                notice, for any reason, including breach of these Terms.
              </p>
              <p className="text-body">
                You may terminate your account at any time by contacting us or using the account deletion 
                feature in your account settings.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">11. Changes to Terms</h2>
              <p className="text-body">
                We reserve the right to modify these Terms at any time. We will notify users of any material 
                changes by email or through the Service. Your continued use of the Service after such changes 
                constitutes acceptance of the new Terms.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">12. Contact Information</h2>
              <p className="text-body">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-sunrise-50 rounded-lg">
                <p className="text-body">
                  <strong>Email:</strong> legal@positivenrg.com<br />
                  <strong>Address:</strong> PositiveNRG Ltd, [Address], [City], [Postcode], UK
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
