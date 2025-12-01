import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { getCompanionProfileByUserId, createCompanionProfile } from "~/lib/companion.server";
import { getAuthUrl } from "~/lib/google-calendar.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import { LegalDisclaimer } from "~/components/LegalDisclaimer";
import { z } from "zod";
import logger from "~/lib/logger.server";

const profileSchema = z.object({
  displayName: z.string().min(1).max(100),
  bio: z.string().max(1000).optional(),
  timezone: z.string(),
  pricePerHour: z.number().min(100).max(1000000),
  currency: z.string().default("GBP"),
  minimumDuration: z.number().min(15).max(480).default(30),
});

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return redirect("/login?redirect=/become-companion");
  }

  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login?redirect=/become-companion");
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return redirect("/login");
  }

  // Check if user already has a companion profile
  const existingProfile = await getCompanionProfileByUserId(user.id);
  if (existingProfile) {
    return redirect("/companion/dashboard");
  }

  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  // Verify authentication
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
  if (!user) {
    return json({ error: "User not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const step = formData.get("step") as string;

    if (step === "1") {
      // Step 1: Basic profile information
      const displayName = formData.get("displayName") as string;
      const bio = formData.get("bio") as string;
      const timezone = formData.get("timezone") as string || "Europe/London";
      const pricePerHour = parseFloat(formData.get("pricePerHour") as string || "5000"); // £50 default
      const minimumDuration = parseInt(formData.get("minimumDuration") as string || "30");

      const validated = profileSchema.parse({
        displayName,
        bio,
        timezone,
        pricePerHour,
        minimumDuration,
      });

      // Create companion profile
      const { id: companionId } = await createCompanionProfile(user.id, {
        ...validated,
        languages: ["English"],
        tags: [],
        specialties: [],
      });

      logger.info({ userId: user.id, companionId }, "Companion profile created");

      return json({ success: true, step: 2, companionId });
    }

    if (step === "2") {
      // Step 2: Google Calendar connection (optional)
      const companionId = formData.get("companionId") as string;
      const connectCalendar = formData.get("connectCalendar") === "true";

      if (connectCalendar && companionId) {
        // Redirect to Google OAuth
        const authUrl = getAuthUrl(companionId);
        return redirect(authUrl);
      }

      // Skip calendar connection
      return json({ success: true, step: 3 });
    }

    return json({ error: "Invalid step" }, { status: 400 });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", userId: user.id },
      "Error creating companion profile"
    );
    return json(
      { error: error instanceof Error ? error.message : "Failed to create profile" },
      { status: 400 }
    );
  }
}

export default function BecomeCompanion() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [currentStep, setCurrentStep] = useState(actionData?.step || 1);

  useEffect(() => {
    if (actionData?.step) {
      setCurrentStep(actionData.step);
    }
  }, [actionData]);

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Disclaimer Banner */}
      <div className="bg-white border-b border-yellow-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <LegalDisclaimer variant="inline" />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card">
          <h1 className="heading-lg mb-6">Become a Companion</h1>
          <p className="text-body text-charcoal-600 mb-8">
            Register as a human companion and help others through friendly conversation and support.
          </p>

          {currentStep === 1 && (
            <Form method="post" className="space-y-6">
              <input type="hidden" name="step" value="1" />

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-charcoal-700 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  required
                  className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-sunrise-500 focus:border-transparent"
                  placeholder="Your public display name"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-charcoal-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-sunrise-500 focus:border-transparent"
                  placeholder="Tell people about yourself and how you can help..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pricePerHour" className="block text-sm font-medium text-charcoal-700 mb-2">
                    Price per Hour (pence) *
                  </label>
                  <input
                    type="number"
                    id="pricePerHour"
                    name="pricePerHour"
                    required
                    min="100"
                    max="1000000"
                    defaultValue="5000"
                    className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-sunrise-500 focus:border-transparent"
                  />
                  <p className="text-xs text-charcoal-500 mt-1">£50.00 = 5000 pence</p>
                </div>

                <div>
                  <label htmlFor="minimumDuration" className="block text-sm font-medium text-charcoal-700 mb-2">
                    Minimum Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    id="minimumDuration"
                    name="minimumDuration"
                    required
                    min="15"
                    max="480"
                    defaultValue="30"
                    className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-sunrise-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-charcoal-700 mb-2">
                  Timezone *
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  required
                  className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-sunrise-500 focus:border-transparent"
                  defaultValue="Europe/London"
                >
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>

              {actionData?.error && (
                <div className="bg-peach-50 border border-peach-200 text-peach-800 px-4 py-3 rounded-xl">
                  {actionData.error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? "Creating Profile..." : "Continue"}
              </button>
            </Form>
          )}

          {currentStep === 2 && (
            <Form method="post" className="space-y-6">
              <input type="hidden" name="step" value="2" />
              <input type="hidden" name="companionId" value={actionData?.companionId || ""} />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="heading-md mb-4">Connect Google Calendar (Optional)</h2>
                <p className="text-body text-charcoal-600 mb-4">
                  Connect your Google Calendar to automatically sync your availability and manage appointments.
                </p>
                <p className="text-sm text-charcoal-500 mb-6">
                  You can skip this step and set up your calendar later from your dashboard.
                </p>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    name="connectCalendar"
                    value="true"
                    className="btn-primary"
                  >
                    Connect Google Calendar
                  </button>
                  <button
                    type="submit"
                    name="connectCalendar"
                    value="false"
                    className="btn-secondary"
                  >
                    Skip for Now
                  </button>
                </div>
              </div>
            </Form>
          )}

          {currentStep === 3 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="heading-md mb-4">Profile Created!</h2>
              <p className="text-body text-charcoal-600 mb-6">
                Your companion profile has been created. It will be reviewed by our team before going live.
              </p>
              <a href="/companion/dashboard" className="btn-primary">
                Go to Dashboard
              </a>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

