import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { verifyLogin, createUserSession } from "~/lib/auth.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if user is already logged in
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  
  if (token) {
    // Verify token and redirect to dashboard
    return redirect("/dashboard");
  }
  
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = await verifyLogin(email, password);
  
  if (!user) {
    return json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const token = createUserSession(user.id);
  
  // Check if onboarding is completed
  const { isOnboardingCompleted } = await import("~/lib/onboarding.server");
  const onboardingCompleted = await isOnboardingCompleted(user.id);
  
  // Redirect to onboarding if not completed, otherwise to dashboard
  const redirectTo = onboardingCompleted ? "/dashboard" : "/onboarding";
  
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
    },
  });
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-16 bg-sunrise-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-xl mb-6 text-charcoal-900">
            Welcome Back
          </h1>
          <p className="text-body text-charcoal-700 max-w-2xl mx-auto">
            Sign in to continue your positive energy journey with your AI companions
          </p>
        </div>
      </section>

      {/* Login Form */}
      <section className="py-16 bg-white">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-sunrise-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="heading-md mb-2">Sign In</h2>
              <p className="text-body text-charcoal-600">
                Access your account to chat with your AI companions
              </p>
            </div>

            <Form method="post" className="space-y-6">
              {actionData?.error && (
                <div className="bg-peach-50 border border-peach-200 text-peach-800 px-4 py-3 rounded-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {actionData.error}
                  </div>
                </div>
              )}

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

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="input"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn-primary w-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-charcoal-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </div>
                )}
              </button>
            </Form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-charcoal-500">Or</span>
              </div>
            </div>

            <Link
              to="/magic-link"
              className="btn-secondary w-full text-center"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Login with Magic Link
            </Link>

            <div className="mt-8 text-center">
              <p className="text-body text-charcoal-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-sunrise-600 hover:text-sunrise-700 font-semibold transition-colors">
                  Create one here
                </Link>
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <div className="bg-pastel-50 border border-pastel-200 rounded-2xl p-6">
              <h3 className="heading-md mb-3 text-pastel-800">New to PositiveNRG?</h3>
              <p className="text-body text-pastel-700 mb-4">
                Join thousands of users who have found their positive energy with our AI companions.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center text-pastel-700">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Free to start
                </div>
                <div className="flex items-center text-pastel-700">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  AI companions
                </div>
                <div className="flex items-center text-pastel-700">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Safe & secure
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
