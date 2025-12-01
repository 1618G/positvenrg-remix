import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { getCompanionProfile } from "~/lib/companion.server";
import { checkAvailability, createAppointment, calculateAppointmentAmount } from "~/lib/appointment.server";
import { createAppointmentPaymentIntent } from "~/lib/appointment-payment.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import { LegalDisclaimer } from "~/components/LegalDisclaimer";
import logger from "~/lib/logger.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Verify authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return redirect("/login?redirect=/book/" + params.companionId);
  }

  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login?redirect=/book/" + params.companionId);
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return redirect("/login");
  }

  const companionId = params.companionId;
  if (!companionId) {
    return redirect("/companions/human");
  }

  const companion = await getCompanionProfile(companionId);
  if (!companion || !companion.isActive) {
    return redirect("/companions/human?error=companion_not_found");
  }

  return json({ user, companion });
}

export async function action({ request, params }: ActionFunctionArgs) {
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

  const companionId = params.companionId;
  if (!companionId) {
    return json({ error: "Companion ID required" }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const step = formData.get("step") as string;

    if (step === "1") {
      // Step 1: Select date and time
      const date = formData.get("date") as string;
      const time = formData.get("time") as string;
      const duration = parseInt(formData.get("duration") as string || "30");

      if (!date || !time) {
        return json({ error: "Date and time are required" }, { status: 400 });
      }

      // Parse date and time
      const startTime = new Date(`${date}T${time}`);
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      // Check availability
      const availability = await checkAvailability(companionId, startTime, endTime);
      if (!availability.available) {
        return json({ error: availability.reason || "Time slot not available" }, { status: 400 });
      }

      return json({
        success: true,
        step: 2,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
      });
    }

    if (step === "2") {
      // Step 2: Select meeting type and add notes
      const startTime = new Date(formData.get("startTime") as string);
      const endTime = new Date(formData.get("endTime") as string);
      const duration = parseInt(formData.get("duration") as string);
      const meetingType = formData.get("meetingType") as "VIDEO_CALL" | "PHONE_CALL" | "TEXT_CHAT" | "IN_PERSON";
      const notes = formData.get("notes") as string;

      // Get companion for pricing
      const companion = await getCompanionProfile(companionId);
      if (!companion) {
        return json({ error: "Companion not found" }, { status: 404 });
      }

      // Calculate amount
      const amount = calculateAppointmentAmount(duration, companion.pricePerHour);

      // Create appointment
      const { id: appointmentId } = await createAppointment({
        userId: user.id,
        companionId,
        startTime,
        endTime,
        duration,
        timezone: companion.timezone,
        meetingType: meetingType || "VIDEO_CALL",
        notes,
        amount,
        currency: companion.currency,
      });

      return json({
        success: true,
        step: 3,
        appointmentId,
        amount,
      });
    }

    if (step === "3") {
      // Step 3: Payment
      const appointmentId = formData.get("appointmentId") as string;

      if (!appointmentId) {
        return json({ error: "Appointment ID required" }, { status: 400 });
      }

      // Create payment intent
      const { clientSecret } = await createAppointmentPaymentIntent(appointmentId);

      return json({
        success: true,
        step: 4,
        appointmentId,
        clientSecret,
      });
    }

    return json({ error: "Invalid step" }, { status: 400 });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", userId: user.id, companionId },
      "Error in booking flow"
    );
    return json(
      { error: error instanceof Error ? error.message : "Booking failed" },
      { status: 400 }
    );
  }
}

export default function BookCompanion() {
  const { user, companion } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [currentStep, setCurrentStep] = useState(actionData?.step || 1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(companion.minimumDuration);

  useEffect(() => {
    if (actionData?.step) {
      setCurrentStep(actionData.step);
    }
  }, [actionData]);

  const pricePerHour = (companion.pricePerHour / 100).toFixed(2);
  const totalAmount = actionData?.amount
    ? (actionData.amount / 100).toFixed(2)
    : ((selectedDuration / 60) * (companion.pricePerHour / 100)).toFixed(2);

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
        <div className="card mb-8">
          <div className="flex items-center space-x-4 mb-6">
            {companion.avatar && (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                {companion.avatar}
              </div>
            )}
            <div>
              <h1 className="heading-lg">{companion.displayName}</h1>
              <p className="text-charcoal-600">£{pricePerHour}/hour</p>
            </div>
          </div>
          {companion.bio && <p className="text-body text-charcoal-600 mb-6">{companion.bio}</p>}
        </div>

        {currentStep === 1 && (
          <div className="card">
            <h2 className="heading-md mb-6">Select Date & Time</h2>
            <Form method="post" className="space-y-6">
              <input type="hidden" name="step" value="1" />

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-charcoal-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-sunrise-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-charcoal-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  required
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-sunrise-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-charcoal-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  required
                  min={companion.minimumDuration}
                  max="480"
                  step="15"
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-sunrise-500 focus:border-transparent"
                />
                <p className="text-xs text-charcoal-500 mt-1">
                  Minimum: {companion.minimumDuration} minutes
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-charcoal-700">
                  <strong>Estimated Cost:</strong> £{totalAmount}
                </p>
              </div>

              {actionData?.error && (
                <div className="bg-peach-50 border border-peach-200 text-peach-800 px-4 py-3 rounded-xl">
                  {actionData.error}
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? "Checking Availability..." : "Continue"}
              </button>
            </Form>
          </div>
        )}

        {currentStep === 2 && actionData?.startTime && (
          <div className="card">
            <h2 className="heading-md mb-6">Meeting Details</h2>
            <Form method="post" className="space-y-6">
              <input type="hidden" name="step" value="2" />
              <input type="hidden" name="startTime" value={actionData.startTime} />
              <input type="hidden" name="endTime" value={actionData.endTime} />
              <input type="hidden" name="duration" value={actionData.duration} />

              <div>
                <label htmlFor="meetingType" className="block text-sm font-medium text-charcoal-700 mb-2">
                  Meeting Type *
                </label>
                <select
                  id="meetingType"
                  name="meetingType"
                  required
                  className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-sunrise-500 focus:border-transparent"
                  defaultValue="VIDEO_CALL"
                >
                  <option value="VIDEO_CALL">Video Call</option>
                  <option value="PHONE_CALL">Phone Call</option>
                  <option value="TEXT_CHAT">Text Chat</option>
                  <option value="IN_PERSON">In Person</option>
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-charcoal-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-sunrise-500 focus:border-transparent"
                  placeholder="Any special requests or information for your companion..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-charcoal-700">
                  <strong>Total Cost:</strong> £{totalAmount}
                </p>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? "Creating Appointment..." : "Continue to Payment"}
              </button>
            </Form>
          </div>
        )}

        {currentStep === 3 && actionData?.appointmentId && (
          <div className="card">
            <h2 className="heading-md mb-6">Payment</h2>
            <p className="text-body text-charcoal-600 mb-6">
              Complete your booking by processing payment. Your appointment will be confirmed once payment is successful.
            </p>
            <p className="text-lg font-semibold text-charcoal-900 mb-6">
              Total: £{totalAmount}
            </p>
            <Form method="post" className="space-y-6">
              <input type="hidden" name="step" value="3" />
              <input type="hidden" name="appointmentId" value={actionData.appointmentId} />
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? "Processing..." : "Proceed to Payment"}
              </button>
            </Form>
          </div>
        )}

        {currentStep === 4 && actionData?.clientSecret && (
          <div className="card">
            <h2 className="heading-md mb-6">Complete Payment</h2>
            <p className="text-body text-charcoal-600 mb-6">
              Please complete the payment to confirm your appointment.
            </p>
            {/* Stripe Elements would be integrated here */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                Payment integration with Stripe Elements will be displayed here.
                For now, payment can be processed via webhook.
              </p>
            </div>
            <a href="/appointments" className="btn-primary w-full text-center block">
              View My Appointments
            </a>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

