import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { runSecurityAudit } from "~/lib/security-audit.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify authentication and admin role
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return redirect("/login?redirect=/admin/security-audit");
  }

  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login?redirect=/admin/security-audit");
  }

  const user = await getUserById(session.userId);
  if (!user || user.role !== "ADMIN") {
    return redirect("/dashboard?error=unauthorized");
  }

  // Run security audit
  const audit = await runSecurityAudit();

  return json({ user, audit });
}

export default function SecurityAudit() {
  const { user, audit } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="heading-xl mb-8">Security Audit</h1>

        <div className="card mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                audit.passed ? "bg-green-100" : "bg-yellow-100"
              }`}
            >
              {audit.passed ? (
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="heading-md">
                {audit.passed ? "All Security Checks Passed" : "Security Issues Found"}
              </h2>
              <p className="text-body text-charcoal-600">
                {audit.checks.length} checks performed
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {audit.checks.map((check, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  check.passed
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-charcoal-900 mb-1">{check.name}</h3>
                    <p className="text-sm text-charcoal-600">{check.message}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      check.passed ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  >
                    {check.passed ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


