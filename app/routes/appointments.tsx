import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { getUserAppointments, cancelAppointment } from "~/lib/appointment.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import { LegalDisclaimer } from "~/components/LegalDisclaimer";
import logger from "~/lib/logger.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return redirect("/login?redirect=/appointments");
  }

  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login?redirect=/appointments");
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return redirect("/login");
  }

  // Get user's appointments
  const upcoming = await getUserAppointments(user.id, {
    status: ["PENDING", "CONFIRMED"],
    upcoming: true,
    limit: 20,
  });

  const past = await getUserAppointments(user.id, {
    status: ["COMPLETED", "CANCELLED", "NO_SHOW"],
    limit: 20,
  });

  return json({ user, upcoming, past });
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
    const action = formData.get("action") as string;
    const appointmentId = formData.get("appointmentId") as string;

    if (action === "cancel" && appointmentId) {
      await cancelAppointment(appointmentId, "user", user.id);
      return json({ success: true, message: "Appointment cancelled" });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", userId: user.id },
      "Error in appointments action"
    );
    return json(
      { error: error instanceof Error ? error.message : "Action failed" },
      { status: 400 }
    );
  }
}

export default function Appointments() {
  const { user, upcoming, past } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

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
        <h1 className="heading-xl mb-8">My Appointments</h1>

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

        {/* Upcoming Appointments */}
        <div className="card mb-8">
          <h2 className="heading-md mb-6">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="text-charcoal-600">No upcoming appointments</p>
          ) : (
            <div className="space-y-4">
              {upcoming.map((appointment) => (
                <div key={appointment.id} className="border border-charcoal-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal-900 mb-2">
                        {appointment.companion.displayName}
                      </h3>
                      <p className="text-sm text-charcoal-600 mb-1">
                        {new Date(appointment.startTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-charcoal-600 mb-1">
                        Duration: {appointment.duration} minutes
                      </p>
                      <p className="text-sm text-charcoal-600 mb-1">
                        Type: {appointment.meetingType.replace("_", " ")}
                      </p>
                      <p className="text-sm font-medium text-charcoal-900 mt-2">
                        £{(appointment.amount / 100).toFixed(2)}
                      </p>
                      {appointment.meetingLink && (
                        <a
                          href={appointment.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                        >
                          Join Meeting →
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          appointment.status === "CONFIRMED"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {appointment.status}
                      </span>
                      {appointment.status !== "CANCELLED" && (
                        <Form method="post">
                          <input type="hidden" name="action" value="cancel" />
                          <input type="hidden" name="appointmentId" value={appointment.id} />
                          <button
                            type="submit"
                            className="text-sm text-red-600 hover:text-red-800"
                            onClick={(e) => {
                              if (!confirm("Are you sure you want to cancel this appointment?")) {
                                e.preventDefault();
                              }
                            }}
                          >
                            Cancel
                          </button>
                        </Form>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Appointments */}
        <div className="card">
          <h2 className="heading-md mb-6">Past</h2>
          {past.length === 0 ? (
            <p className="text-charcoal-600">No past appointments</p>
          ) : (
            <div className="space-y-4">
              {past.map((appointment) => (
                <div key={appointment.id} className="border border-charcoal-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal-900 mb-2">
                        {appointment.companion.displayName}
                      </h3>
                      <p className="text-sm text-charcoal-600 mb-1">
                        {new Date(appointment.startTime).toLocaleString()}
                      </p>
                      {appointment.userRating && (
                        <div className="mt-2">
                          <span className="text-sm text-charcoal-600">Your rating: </span>
                          <span className="text-sm font-medium">
                            {appointment.userRating}/5 ⭐
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          appointment.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

