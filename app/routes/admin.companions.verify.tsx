import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { verifyCompanion, getActiveCompanions } from "~/lib/companion.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import logger from "~/lib/logger.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify authentication and admin role
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return redirect("/login?redirect=/admin/companions/verify");
  }

  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login?redirect=/admin/companions/verify");
  }

  const user = await getUserById(session.userId);
  if (!user || user.role !== "ADMIN") {
    return redirect("/dashboard?error=unauthorized");
  }

  // Get unverified companions
  const unverified = await getActiveCompanions({
    verified: false,
    limit: 50,
  });

  return json({ user, unverified });
}

export async function action({ request }: ActionFunctionArgs) {
  // Verify authentication and admin role
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyUserSession(token);
  if (!session) {
    return json({ error: "Invalid session" }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (!user || user.role !== "ADMIN") {
    return json({ error: "Unauthorized - admin access required" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const action = formData.get("action") as string;
    const companionId = formData.get("companionId") as string;

    if (action === "verify" && companionId) {
      await verifyCompanion(companionId, user.id);
      return json({ success: true, message: "Companion verified" });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", userId: user.id },
      "Error in admin companion verification"
    );
    return json(
      { error: error instanceof Error ? error.message : "Action failed" },
      { status: 400 }
    );
  }
}

export default function AdminCompanionVerification() {
  const { user, unverified } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="heading-xl mb-8">Verify Companions</h1>

        {actionData?.success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-6">
            {actionData.message}
          </div>
        )}

        {actionData?.error && (
          <div className="bg-peach-50 border border-peach-200 text-peach-800 px-4 py-3 rounded-xl mb-6">
            {actionData.error}
          </div>
        )}

        {unverified.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-charcoal-600">No companions pending verification</p>
          </div>
        ) : (
          <div className="space-y-4">
            {unverified.map((companion) => (
              <div key={companion.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="heading-md">{companion.displayName}</h3>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Pending Verification
                      </span>
                    </div>
                    {companion.bio && (
                      <p className="text-body text-charcoal-600 mb-2">{companion.bio}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-charcoal-600">Price:</span>{" "}
                        <span className="font-medium">£{(companion.pricePerHour / 100).toFixed(2)}/hr</span>
                      </div>
                      <div>
                        <span className="text-charcoal-600">Min Duration:</span>{" "}
                        <span className="font-medium">{companion.minimumDuration} min</span>
                      </div>
                      <div>
                        <span className="text-charcoal-600">Timezone:</span>{" "}
                        <span className="font-medium">{companion.timezone}</span>
                      </div>
                      <div>
                        <span className="text-charcoal-600">User:</span>{" "}
                        <span className="font-medium">{companion.user.email}</span>
                      </div>
                    </div>
                  </div>
                  <Form method="post" className="ml-4">
                    <input type="hidden" name="action" value="verify" />
                    <input type="hidden" name="companionId" value={companion.id} />
                    <button type="submit" className="btn-primary">
                      Verify
                    </button>
                  </Form>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

