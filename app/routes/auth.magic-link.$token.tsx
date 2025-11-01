import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { verifyMagicLinkToken } from "~/lib/email.server";
import { createUserSession } from "~/lib/auth.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = params.token;

  if (!token) {
    return json({ verified: false, error: "No token provided" });
  }

  const result = await verifyMagicLinkToken(token);

  if (!result.success || !result.user) {
    return json({ verified: false, error: result.error || "Invalid token" });
  }

  // Create session and redirect to dashboard
  const sessionToken = createUserSession(result.user.id);
  
  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": `token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
    },
  });
}

export default function MagicLinkAuth() {
  const data = useLoaderData<typeof loader>();

  if (data.verified === false) {
    return (
      <div className="min-h-screen bg-sunrise-50">
        <Navigation />
        
        <section className="py-16">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-peach-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-peach-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="heading-md mb-4 text-charcoal-900">
                Invalid Link
              </h2>
              <p className="text-body text-charcoal-700 mb-6">
                {data.error || "This magic link is invalid or has expired."}
              </p>
              <div className="space-y-3">
                <Link to="/magic-link" className="btn-primary w-full">
                  Request New Link
                </Link>
                <Link to="/login" className="btn-secondary w-full">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  // This shouldn't be reached due to redirect, but just in case
  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sunrise-500 mx-auto"></div>
          <p className="mt-4 text-charcoal-700">Logging you in...</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

