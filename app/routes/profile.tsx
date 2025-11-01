import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { getUserSubscription } from "~/lib/subscription.server";
import { getOnboardingData } from "~/lib/onboarding.server";
import { db } from "~/lib/db.server";
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

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      preferences: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    return redirect("/login");
  }

  const subscription = await getUserSubscription(user.id);
  const onboardingData = await getOnboardingData(user.id);

  return json({ user, subscription, onboardingData });
}

export async function action({ request }: ActionFunctionArgs) {
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

  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (action === "updateProfile") {
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string || undefined;
    const location = formData.get("location") as string || undefined;

    await db.user.update({
      where: { id: session.userId },
      data: { name, bio, location },
    });

    return json({ success: true, message: "Profile updated successfully" });
  }

  return json({ success: false, message: "Invalid action" }, { status: 400 });
}

export default function Profile() {
  const { user, subscription, onboardingData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      <section className="py-12 bg-sunrise-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="heading-xl mb-4 text-charcoal-900">My Profile</h1>
          <p className="text-body text-charcoal-700">
            Manage your profile, preferences, and account settings
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h2 className="heading-md mb-6">Profile Information</h2>
                
                {actionData?.success && (
                  <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl">
                    {actionData.message}
                  </div>
                )}

                <Form method="post" className="space-y-6">
                  <input type="hidden" name="action" value="updateProfile" />
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="input bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-charcoal-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={user.name || ""}
                      className="input"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      rows={4}
                      defaultValue={user.bio || ""}
                      className="input"
                      placeholder="Tell us a bit about yourself..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      name="location"
                      defaultValue={user.location || ""}
                      className="input"
                      placeholder="City, Country"
                    />
                  </div>

                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                </Form>
              </div>

              {/* Onboarding Data */}
              {onboardingData && (
                <div className="card">
                  <h2 className="heading-md mb-6">Onboarding Information</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-charcoal-700 mb-1">Communication Style</div>
                      <div className="text-body text-charcoal-900 capitalize">{onboardingData.communicationStyle}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-charcoal-700 mb-1">Response Length</div>
                      <div className="text-body text-charcoal-900 capitalize">{onboardingData.responseLength}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-charcoal-700 mb-1">Primary Needs</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {onboardingData.primaryNeeds?.map((need: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-sunrise-100 text-sunrise-800 text-sm rounded-full">
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                    {onboardingData.goals && (
                      <div>
                        <div className="text-sm font-medium text-charcoal-700 mb-1">Goals</div>
                        <div className="text-body text-charcoal-900">{onboardingData.goals}</div>
                      </div>
                    )}
                    {onboardingData.triggers && onboardingData.triggers.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-charcoal-700 mb-1">Triggers</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {onboardingData.triggers.map((trigger: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-peach-100 text-peach-800 text-sm rounded-full">
                              {trigger}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-6">
                    <a href="/onboarding" className="text-sunrise-600 hover:text-sunrise-700 text-sm font-medium">
                      Update Onboarding Preferences →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Subscription */}
              <div className="card">
                <h3 className="heading-md mb-4">Subscription</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-charcoal-600">Current Plan</div>
                    <div className="font-semibold text-charcoal-900 capitalize mt-1">
                      {subscription.planType.toLowerCase().replace('_', ' ')}
                    </div>
                  </div>
                  {subscription.planType === "FREE" || subscription.planType.includes("TOKEN") ? (
                    <div>
                      <div className="text-sm text-charcoal-600">Tokens Remaining</div>
                      <div className="font-semibold text-charcoal-900 mt-1">{subscription.tokensRemaining}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-charcoal-600">Messages Used</div>
                      <div className="font-semibold text-charcoal-900 mt-1">
                        {subscription.messagesUsed} / {subscription.messagesAllowed || "∞"}
                      </div>
                    </div>
                  )}
                  <a href="/pricing" className="btn-secondary w-full mt-4 text-center">
                    Manage Subscription
                  </a>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="card">
                <h3 className="heading-md mb-4">Account Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal-600">Member Since</span>
                    <span className="font-medium text-charcoal-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-600">Role</span>
                    <span className="font-medium text-charcoal-900 capitalize">{user.role}</span>
                  </div>
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



