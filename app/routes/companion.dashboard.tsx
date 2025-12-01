import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { getCompanionProfileByUserId } from "~/lib/companion.server";
import { db } from "~/lib/db.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import { LegalDisclaimer } from "~/components/LegalDisclaimer";

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return redirect("/login?redirect=/companion/dashboard");
  }

  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login?redirect=/companion/dashboard");
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return redirect("/login");
  }

  // Get companion profile
  const companion = await getCompanionProfileByUserId(user.id);
  
  if (!companion) {
    return redirect("/become-companion");
  }

  // Get recent appointments
  const recentAppointments = await db.appointment.findMany({
    where: { companionId: companion.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
    take: 10,
  });

  // Get upcoming appointments
  const upcomingAppointments = await db.appointment.findMany({
    where: {
      companionId: companion.id,
      startTime: { gte: new Date() },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
    take: 10,
  });

  // Get earnings summary
  const earnings = await db.companionEarning.aggregate({
    where: {
      companionId: companion.id,
      status: "COMPLETED",
    },
    _sum: {
      netAmount: true,
    },
  });

  // Get review stats
  const reviews = await db.companionReview.findMany({
    where: { companionId: companion.id },
    select: { rating: true },
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return json({
    companion,
    recentAppointments,
    upcomingAppointments,
    totalEarnings: earnings._sum.netAmount || 0,
    totalReviews: reviews.length,
    averageRating,
  });
}

export default function CompanionDashboard() {
  const { companion, recentAppointments, upcomingAppointments, totalEarnings, totalReviews, averageRating } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Disclaimer Banner */}
      <div className="bg-white border-b border-yellow-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <LegalDisclaimer variant="inline" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="heading-xl mb-2">Companion Dashboard</h1>
          <p className="text-body text-charcoal-600">
            Manage your companion profile, appointments, and earnings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-sm text-charcoal-600 mb-1">Status</div>
            <div className="text-2xl font-bold text-charcoal-900">
              {companion.isActive ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-gray-400">Inactive</span>
              )}
            </div>
            {companion.isVerified && (
              <div className="text-xs text-green-600 mt-1">✓ Verified</div>
            )}
          </div>

          <div className="card">
            <div className="text-sm text-charcoal-600 mb-1">Total Bookings</div>
            <div className="text-2xl font-bold text-charcoal-900">{companion.totalBookings}</div>
          </div>

          <div className="card">
            <div className="text-sm text-charcoal-600 mb-1">Total Earnings</div>
            <div className="text-2xl font-bold text-charcoal-900">
              £{(totalEarnings / 100).toFixed(2)}
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-charcoal-600 mb-1">Average Rating</div>
            <div className="text-2xl font-bold text-charcoal-900">
              {averageRating ? averageRating.toFixed(1) : "N/A"}
            </div>
            <div className="text-xs text-charcoal-500 mt-1">{totalReviews} reviews</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/companion/profile/edit" className="card hover:shadow-lg transition-shadow">
            <h3 className="heading-md mb-2">Edit Profile</h3>
            <p className="text-sm text-charcoal-600">Update your bio, pricing, and availability</p>
          </Link>

          <Link
            to={companion.calendarSyncEnabled ? "/companion/calendar" : "/api/auth/google?companionId=" + companion.id}
            className="card hover:shadow-lg transition-shadow"
          >
            <h3 className="heading-md mb-2">Calendar</h3>
            <p className="text-sm text-charcoal-600">
              {companion.calendarSyncEnabled ? "Manage calendar sync" : "Connect Google Calendar"}
            </p>
          </Link>

          <Link to="/appointments" className="card hover:shadow-lg transition-shadow">
            <h3 className="heading-md mb-2">View All Appointments</h3>
            <p className="text-sm text-charcoal-600">See all your bookings and manage them</p>
          </Link>
        </div>

        {/* Upcoming Appointments */}
        <div className="card mb-8">
          <h2 className="heading-md mb-4">Upcoming Appointments</h2>
          {upcomingAppointments.length === 0 ? (
            <p className="text-charcoal-600">No upcoming appointments</p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="border border-charcoal-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-charcoal-900">{appointment.user.name || appointment.user.email}</h3>
                      <p className="text-sm text-charcoal-600">
                        {new Date(appointment.startTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-charcoal-600">
                        Duration: {appointment.duration} minutes
                      </p>
                      <p className="text-sm font-medium text-charcoal-900 mt-2">
                        £{(appointment.amount / 100).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        appointment.status === "CONFIRMED" ? "bg-green-100 text-green-800" :
                        appointment.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Appointments */}
        <div className="card">
          <h2 className="heading-md mb-4">Recent Appointments</h2>
          {recentAppointments.length === 0 ? (
            <p className="text-charcoal-600">No recent appointments</p>
          ) : (
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div key={appointment.id} className="border border-charcoal-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-charcoal-900">{appointment.user.name || appointment.user.email}</h3>
                      <p className="text-sm text-charcoal-600">
                        {new Date(appointment.startTime).toLocaleString()}
                      </p>
                      {appointment.userRating && (
                        <div className="mt-2">
                          <span className="text-sm text-charcoal-600">Rating: </span>
                          <span className="text-sm font-medium">{appointment.userRating}/5</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        appointment.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                        appointment.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
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

