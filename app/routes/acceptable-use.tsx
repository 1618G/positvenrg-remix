import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="heading-xl mb-8">Acceptable Use Policy</h1>
          <p className="text-body mb-6">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-body">
            This Acceptable Use Policy outlines the rules and guidelines for using PositiveNRG's AI companionship 
            platform. By using our service, you agree to follow these guidelines to ensure a safe and supportive 
            environment for all users.
          </p>
        </div>
      </section>

      {/* Policy Content */}
      <section className="py-20 bg-sunrise-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="card">
              <h2 className="heading-lg mb-6">1. Purpose of This Policy</h2>
              <p className="text-body mb-4">
                PositiveNRG is designed to provide a safe, supportive space for emotional well-being and 
                companionship. This policy ensures that all users can benefit from our service in a 
                respectful and constructive environment.
              </p>
              <p className="text-body">
                Our AI companions are here to listen, support, and encourage you. By following these guidelines, 
                you help create a positive experience for yourself and help us maintain the quality of our service.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">2. Appropriate Use</h2>
              <p className="text-body mb-4">
                We encourage you to use PositiveNRG for:
              </p>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Sharing your thoughts, feelings, and experiences</li>
                <li>Seeking emotional support and encouragement</li>
                <li>Discussing daily challenges and goals</li>
                <li>Practicing mindfulness and stress relief</li>
                <li>Building positive habits and motivation</li>
                <li>Having friendly, supportive conversations</li>
                <li>Processing emotions and experiences</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">3. Prohibited Content and Behavior</h2>
              <p className="text-body mb-4">
                The following content and behaviors are not allowed on our platform:
              </p>
              
              <h3 className="heading-md mb-4 mt-6">Harmful Content</h3>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Content that promotes self-harm, suicide, or violence</li>
                <li>Threats of violence or harm to others</li>
                <li>Content that encourages dangerous behaviors</li>
                <li>Graphic descriptions of violence or harm</li>
              </ul>

              <h3 className="heading-md mb-4 mt-6">Inappropriate Content</h3>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Sexually explicit or inappropriate content</li>
                <li>Hate speech, discrimination, or harassment</li>
                <li>Content that targets or bullies others</li>
                <li>Spam, scams, or fraudulent content</li>
              </ul>

              <h3 className="heading-md mb-4 mt-6">Illegal Activities</h3>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Sharing illegal content or activities</li>
                <li>Attempting to hack or compromise our systems</li>
                <li>Sharing personal information of others without consent</li>
                <li>Any activity that violates applicable laws</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">4. Safety Guidelines</h2>
              <p className="text-body mb-4">
                To maintain a safe environment, please:
              </p>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Be respectful and kind in your interactions</li>
                <li>Use appropriate language and tone</li>
                <li>Respect the boundaries of our AI companions</li>
                <li>Report any concerning behavior or content</li>
                <li>Seek professional help for serious mental health concerns</li>
                <li>Use the service for its intended purpose of emotional support</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">5. Crisis Situations</h2>
              <p className="text-body mb-4">
                <strong>Important:</strong> If you are experiencing a mental health crisis or having thoughts 
                of self-harm, please contact emergency services immediately:
              </p>
              <div className="mt-4 p-4 bg-peach-50 border border-peach-200 rounded-lg">
                <ul className="space-y-2 text-body">
                  <li><strong>Emergency Services:</strong> 999</li>
                  <li><strong>Samaritans:</strong> 116 123 (free, 24/7)</li>
                  <li><strong>NHS 111:</strong> Non-emergency support</li>
                  <li><strong>Text SHOUT:</strong> 85258 for crisis text support</li>
                </ul>
              </div>
              <p className="text-body mt-4">
                PositiveNRG is not a replacement for emergency mental health care. Our AI companions 
                are designed for ongoing support and companionship, not crisis intervention.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">6. Professional Boundaries</h2>
              <p className="text-body mb-4">
                Our AI companions are designed to be supportive friends, not medical professionals. 
                They cannot:
              </p>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Provide medical or psychiatric diagnosis</li>
                <li>Replace professional therapy or counseling</li>
                <li>Provide crisis intervention or emergency care</li>
                <li>Make medical or treatment recommendations</li>
                <li>Prescribe medications or treatments</li>
              </ul>
              <p className="text-body mt-4">
                If you need professional mental health support, we encourage you to seek help from 
                qualified mental health professionals.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">7. Privacy and Confidentiality</h2>
              <p className="text-body mb-4">
                While our AI companions provide a safe space for sharing, please remember:
              </p>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Don't share personal information of others without their consent</li>
                <li>Be mindful of what you share in conversations</li>
                <li>Our AI companions remember conversations for context, but this data is encrypted and private</li>
                <li>We may need to review conversations for safety purposes only</li>
                <li>Your conversations are not shared with other users</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">8. Consequences of Violations</h2>
              <p className="text-body mb-4">
                Violations of this Acceptable Use Policy may result in:
              </p>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Warning notifications about inappropriate behavior</li>
                <li>Temporary restrictions on certain features</li>
                <li>Suspension of your account</li>
                <li>Permanent termination of your account</li>
                <li>Reporting to appropriate authorities for serious violations</li>
              </ul>
              <p className="text-body mt-4">
                We reserve the right to take appropriate action to protect the safety and well-being 
                of our users and maintain the integrity of our service.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">9. Reporting Violations</h2>
              <p className="text-body mb-4">
                If you encounter content or behavior that violates this policy, please report it immediately:
              </p>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Use the report function in our app</li>
                <li>Email us at safety@positivenrg.com</li>
                <li>Contact our support team through the help center</li>
              </ul>
              <p className="text-body mt-4">
                We take all reports seriously and will investigate promptly. Your report helps us 
                maintain a safe environment for everyone.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">10. Updates to This Policy</h2>
              <p className="text-body">
                We may update this Acceptable Use Policy from time to time to reflect changes in our 
                service or legal requirements. We will notify users of any material changes and post 
                the updated policy on our website.
              </p>
            </div>

            <div className="card">
              <h2 className="heading-lg mb-6">11. Contact Information</h2>
              <p className="text-body mb-4">
                If you have questions about this Acceptable Use Policy, please contact us:
              </p>
              <div className="mt-4 p-4 bg-sunrise-50 rounded-lg">
                <p className="text-body">
                  <strong>Email:</strong> safety@positivenrg.com<br />
                  <strong>Support:</strong> support@positivenrg.com<br />
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
