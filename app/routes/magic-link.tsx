import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { db } from "~/lib/db.server";
import { createMagicLinkToken, sendMagicLink } from "~/lib/email.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  // Find user by email
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    // Don't reveal if email exists - return success message anyway
    return json({
      success: true,
      message: "If an account exists with this email, a magic link has been sent.",
    });
  }

  try {
    const token = await createMagicLinkToken(user.id);
    await sendMagicLink(user.email, token);

    return json({
      success: true,
      message: "Magic link sent! Check your email for the login link.",
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error', email }, 'Failed to send magic link');
    return json(
      { error: "Failed to send magic link. Please try again." },
      { status: 500 }
    );
  }
}

export default function MagicLink() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      <section className="py-16 bg-sunrise-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-xl mb-6 text-charcoal-900">
            Passwordless Login
          </h1>
          <p className="text-body text-charcoal-700 max-w-2xl mx-auto">
            Enter your email and we'll send you a secure login link
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-pastel-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="heading-md mb-2">Get Your Magic Link</h2>
              <p className="text-body text-charcoal-600">
                We'll email you a secure link to log in without a password
              </p>
            </div>

            {actionData?.error && (
              <div className="bg-peach-50 border border-peach-200 text-peach-800 px-4 py-3 rounded-xl mb-6">
                {actionData.error}
              </div>
            )}

            {actionData?.success ? (
              <div className="bg-pastel-50 border border-pastel-200 text-pastel-800 px-4 py-3 rounded-xl mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {actionData.message}
                </div>
                <p className="text-sm mt-2">
                  Check your email and click the link to log in. The link expires in 15 minutes.
                </p>
              </div>
            ) : (
              <Form method="post" className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="input"
                    placeholder="Enter your email address"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-primary w-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    "Send Magic Link"
                  )}
                </button>
              </Form>
            )}

            <div className="mt-8 text-center space-y-3">
              <Link to="/login" className="block text-sm text-sunrise-600 hover:text-sunrise-700 font-semibold">
                Back to Login
              </Link>
              <p className="text-body text-charcoal-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-sunrise-600 hover:text-sunrise-700 font-semibold">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

