import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/lib/db.server";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import { Prisma } from "@prisma/client";

export async function loader({ request }: LoaderFunctionArgs) {
  // Require admin authentication
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
  if (!user || user.role !== "ADMIN") {
    return redirect("/dashboard");
  }

  // Get subscription statistics
  const subscriptions = await db.subscription.findMany({
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  // Count by plan type
  const planCounts = subscriptions.reduce((acc, sub) => {
    acc[sub.planType] = (acc[sub.planType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get total revenue (estimated from subscriptions)
  const activeSubscriptions = subscriptions.filter(
    s => s.status === "ACTIVE" && ["STARTER", "PROFESSIONAL", "PREMIUM"].includes(s.planType)
  );

  const revenueEstimate = activeSubscriptions.reduce((sum, sub) => {
    if (sub.planType === "STARTER") return sum + 10;
    if (sub.planType === "PROFESSIONAL") return sum + 20;
    if (sub.planType === "PREMIUM") return sum + 50;
    return sum;
  }, 0);

  // Get companion access info
  const companions = await db.companion.findMany({
    where: { isActive: true },
    select: { id: true, name: true, avatar: true, isPremium: true },
  });

  return json({
    subscriptions,
    planCounts,
    revenueEstimate,
    companions,
    user,
  });
}

export default function AdminPricing() {
  const { subscriptions, planCounts, revenueEstimate, companions, user } = useLoaderData<typeof loader>();

  const plans = [
    { type: "FREE", price: "£0", interactions: "10 conversations", features: ["Basic companions"] },
    { type: "STARTER", price: "£10", interactions: "1,000/month", features: ["All basic companions"] },
    { type: "PROFESSIONAL", price: "£20", interactions: "2,500/month", features: ["All companions"] },
    { type: "PREMIUM", price: "£50", interactions: "Unlimited", features: ["All companions", "Priority support"] },
  ];

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="heading-xl text-charcoal-900">Pricing & Subscription Management</h1>
            <p className="text-body text-charcoal-600 mt-2">View subscription statistics and manage plans</p>
          </div>
          <div className="flex gap-4">
            <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
            <Link to="/admin/companions" className="btn-secondary">Companions</Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-sunrise-600 mb-2">
              {subscriptions.length}
            </div>
            <div className="text-sm text-charcoal-600">Total Subscriptions</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-peach-600 mb-2">
              £{revenueEstimate}
            </div>
            <div className="text-sm text-charcoal-600">Monthly Revenue (Est.)</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-pastel-600 mb-2">
              {subscriptions.filter(s => s.status === "ACTIVE").length}
            </div>
            <div className="text-sm text-charcoal-600">Active Subscriptions</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-warm-600 mb-2">
              {companions.length}
            </div>
            <div className="text-sm text-charcoal-600">Active Companions</div>
          </div>
        </div>

        {/* Plan Overview */}
        <div className="card mb-8">
          <h2 className="heading-md mb-6">Subscription Plans</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div key={plan.type} className="border border-charcoal-200 rounded-xl p-6">
                <h3 className="font-semibold text-charcoal-900 mb-2">{plan.type}</h3>
                <div className="text-2xl font-bold text-charcoal-900 mb-1">{plan.price}</div>
                <div className="text-sm text-charcoal-600 mb-4">{plan.interactions}</div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-charcoal-700">
                      <svg className="w-4 h-4 text-pastel-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="text-sm font-semibold text-charcoal-900">
                  {planCounts[plan.type] || 0} subscribers
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Companion Access */}
        <div className="card mb-8">
          <h2 className="heading-md mb-6">Companion Access by Tier</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-charcoal-900 mb-3">Free Tier</h3>
              <div className="flex flex-wrap gap-2">
                {companions.filter(c => !c.isPremium).map((c) => (
                  <span key={c.id} className="px-3 py-1 bg-pastel-100 text-pastel-800 rounded-full text-sm">
                    {c.avatar} {c.name}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-charcoal-900 mb-3">Paid Tiers (Starter, Professional, Premium)</h3>
              <div className="flex flex-wrap gap-2">
                {companions.map((c) => (
                  <span
                    key={c.id}
                    className={`px-3 py-1 rounded-full text-sm ${
                      c.isPremium
                        ? "bg-peach-100 text-peach-800"
                        : "bg-pastel-100 text-pastel-800"
                    }`}
                  >
                    {c.avatar} {c.name} {c.isPremium && "⭐"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="card">
          <h2 className="heading-md mb-6">Recent Subscriptions</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-charcoal-200">
                  <th className="text-left py-3 px-4 font-semibold text-charcoal-900">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-charcoal-900">Plan</th>
                  <th className="text-left py-3 px-4 font-semibold text-charcoal-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-charcoal-900">Interactions</th>
                  <th className="text-left py-3 px-4 font-semibold text-charcoal-900">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {subscriptions.slice(0, 20).map((sub) => (
                  <tr key={sub.id}>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-charcoal-900">
                        {sub.user.name || sub.user.email}
                      </div>
                      <div className="text-xs text-charcoal-600">{sub.user.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-sunrise-100 text-sunrise-800 rounded-full text-xs font-medium">
                        {sub.planType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sub.status === "ACTIVE"
                          ? "bg-pastel-100 text-pastel-800"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-charcoal-700">
                      {sub.interactionsAllowed 
                        ? `${sub.interactionsUsed} / ${sub.interactionsAllowed.toLocaleString()}`
                        : "Unlimited"}
                    </td>
                    <td className="py-4 px-4 text-sm text-charcoal-600">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

