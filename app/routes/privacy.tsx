import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="heading-xl mb-8">Privacy Policy</h1>
          <p className="text-body mb-6">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-body">
            At PositiveNRG, we are committed to protecting your privacy and ensuring the security of your 
            personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-20 bg-sunrise-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="card">
              <h2 className="heading-lg mb-6">1. Information We Collect</h2>
              <h3 className="heading-md mb-4">Personal Information</h3>
              <p className="text-body mb-4">
                We collect information you provide directly to us, such as:
              </p>
              <ul className="list-disc list-inside text-body mb-6 space-y-2">
                <li>Email address and password (for account creation)</li>
                <li>Name (optional, for personalization)</li>
                <li>Conversation content with AI companions</li>
                <li>Usage patterns and preferences</li>
                <li>Support requests and communications</li>
              </ul>

              <h3 className="heading-md mb-4">Automatically Collected Information</h3>
              <p className="text-body mb-4">
                We automatically collect certain information when you use our Service:
              </p>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Device information (type, operating system, browser)</li>
                <li>IP address and location data</li>
                <li>Usage statistics and interaction patterns</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">2. How We Use Your Information</h2>
              <p className="text-body mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Provide and improve our AI companionship services</li>
                <li>Personalize your experience with our companions</li>
                <li>Maintain conversation context and memory</li>
                <li>Ensure platform safety and security</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important service updates and notifications</li>
                <li>Analyze usage patterns to improve our service</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">3. Data Security</h2>
              <p className="text-body mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-body mb-4 space-y-2">
                <li>End-to-end encryption for all conversations</li>
                <li>Secure data transmission using HTTPS/TLS</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication systems</li>
                <li>Secure data storage with encryption at rest</li>
              </ul>
              <p className="text-body">
                While we strive to protect your information, no method of transmission over the internet 
                is 100% secure. We cannot guarantee absolute security but continuously work to improve 
                our security measures.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">4. Data Sharing and Disclosure</h2>
              <p className="text-body mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share 
                your information only in the following limited circumstances:
              </p>
              <ul className="list-disc list-inside text-body space-y-2">
                <li><strong>Service Providers:</strong> With trusted third-party services that help us operate our platform (all bound by strict confidentiality agreements)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or legal process</li>
                <li><strong>Safety Concerns:</strong> To protect the safety of users or the public</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with user notification)</li>
                <li><strong>Consent:</strong> When you explicitly consent to sharing</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">5. Your Rights and Choices</h2>
              <p className="text-body mb-4">
                Under GDPR and other applicable privacy laws, you have the following rights:
              </p>
              <ul className="list-disc list-inside text-body mb-4 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
                <li><strong>Objection:</strong> Object to certain types of data processing</li>
              </ul>
              <p className="text-body">
                To exercise these rights, contact us at privacy@positivenrg.com. We will respond to your 
                request within 30 days.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">6. Data Retention</h2>
              <p className="text-body mb-4">
                We retain your information for as long as necessary to provide our services and fulfill 
                the purposes outlined in this Privacy Policy:
              </p>
              <ul className="list-disc list-inside text-body space-y-2">
                <li><strong>Account Data:</strong> Until you delete your account</li>
                <li><strong>Conversation Data:</strong> Until you delete conversations or your account</li>
                <li><strong>Usage Analytics:</strong> Aggregated and anonymized data may be retained longer</li>
                <li><strong>Legal Requirements:</strong> Some data may be retained longer for legal compliance</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">7. Cookies and Tracking</h2>
              <p className="text-body mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-body mb-4 space-y-2">
                <li>Remember your preferences and settings</li>
                <li>Analyze how you use our service</li>
                <li>Improve our platform functionality</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
              <p className="text-body">
                You can control cookie settings through your browser, but disabling cookies may affect 
                some functionality of our service.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">8. International Data Transfers</h2>
              <p className="text-body">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place for international transfers, including 
                standard contractual clauses and adequacy decisions where applicable.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">9. Children's Privacy</h2>
              <p className="text-body">
                Our service is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If we become aware that we have collected 
                personal information from a child under 13, we will take steps to delete such information.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">10. Changes to This Privacy Policy</h2>
              <p className="text-body">
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by email or through our service. Your continued use of the service after such 
                changes constitutes acceptance of the updated Privacy Policy.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">11. Contact Us</h2>
              <p className="text-body mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-4 p-4 bg-sunrise-50 rounded-lg">
                <p className="text-body">
                  <strong>Email:</strong> privacy@positivenrg.com<br />
                  <strong>Data Protection Officer:</strong> dpo@positivenrg.com<br />
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
