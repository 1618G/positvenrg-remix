import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { getUserSubscription } from "~/lib/subscription.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  // Verify authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];
  
  if (!token) {
    return redirect("/login");
  }

  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login");
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return redirect("/login");
  }

  const subscription = await getUserSubscription(user.id);

  return json({ user, subscription, sessionId });
}

export default function SubscriptionSuccess() {
  const { user, subscription } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      <section className="py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center">
            <div className="w-16 h-16 bg-pastel-gradient rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="heading-md mb-4 text-charcoal-900">
              Payment Successful!
            </h2>
            <p className="text-body text-charcoal-700 mb-6">
              Thank you for subscribing to {subscription.planType.replace('_', ' ')}. Your account has been upgraded.
            </p>
            
            {subscription.interactionsAllowed ? (
              <div className="bg-pastel-50 border border-pastel-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-pastel-800">
                  You now have <strong>{subscription.interactionsAllowed.toLocaleString()}</strong> interactions per month.
                </p>
              </div>
            ) : (
              <div className="bg-pastel-50 border border-pastel-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-pastel-800">
                  You now have <strong>unlimited</strong> interactions!
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Link to="/dashboard" className="btn-primary w-full">
                Go to Dashboard
              </Link>
              <Link to="/companions" className="btn-secondary w-full">
                Start Chatting
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

