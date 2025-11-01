import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { createVerificationToken, sendVerificationEmail } from "~/lib/email.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function loader({ request }: LoaderFunctionArgs) {
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

  return json({ user: { email: user.email, emailVerified: user.emailVerified } });
}

export async function action({ request }: ActionFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = verifyUserSession(token);
  if (!session) {
    return json({ error: "Invalid session" }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return json({ error: "User not found" }, { status: 404 });
  }

  if (user.emailVerified) {
    return json({ error: "Email is already verified" }, { status: 400 });
  }

  try {
    const verificationToken = await createVerificationToken(user.id);
    await sendVerificationEmail(user.id, user.email, verificationToken);
    
    return json({ success: true, message: "Verification email sent!" });
  } catch (error) {
    return json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 }
    );
  }
}

export default function ResendVerification() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      <section className="py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-pastel-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="heading-md mb-2">Resend Verification Email</h2>
              <p className="text-body text-charcoal-600">
                We'll send a new verification link to {loaderData.user.email}
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
              </div>
            ) : (
              <Form method="post">
                <button type="submit" className="btn-primary w-full">
                  Resend Verification Email
                </button>
              </Form>
            )}

            <div className="mt-6 text-center space-y-3">
              <Link to="/dashboard" className="block text-sm text-sunrise-600 hover:text-sunrise-700">
                Back to Dashboard
              </Link>
              <Link to="/login" className="block text-sm text-charcoal-600 hover:text-charcoal-700">
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

