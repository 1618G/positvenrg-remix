import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { db } from "~/lib/db.server";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { getUserSubscription } from "~/lib/subscription.server";
import {
  getStripeInvoices,
  cancelStripeSubscription,
  reactivateStripeSubscription,
  changeSubscriptionPlan,
  createCustomerPortalSession,
  getStripeSubscription,
  PLAN_CONFIG,
} from "~/lib/stripe.server";
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

  const subscription = await getUserSubscription(user.id);

  // Fetch invoices if user has Stripe customer ID
  let invoices = [];
  let stripeSubscription = null;
  
  if (subscription.stripeCustomerId) {
    try {
      invoices = await getStripeInvoices(subscription.stripeCustomerId);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }

    if (subscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await getStripeSubscription(subscription.stripeSubscriptionId);
      } catch (error) {
        console.error("Error fetching Stripe subscription:", error);
      }
    }
  }

  return json({
    user,
    subscription,
    invoices,
    stripeSubscription,
  });
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

  const subscription = await getUserSubscription(user.id);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "cancel": {
        const cancelImmediately = formData.get("cancelImmediately") === "true";
        
        if (!subscription.stripeSubscriptionId) {
          return json({ error: "No active subscription to cancel" }, { status: 400 });
        }

        await cancelStripeSubscription(subscription.stripeSubscriptionId, cancelImmediately);
        
        // Update local subscription status
        await db.subscription.update({
          where: { userId: user.id },
          data: {
            cancelAtPeriodEnd: !cancelImmediately,
            canceledAt: cancelImmediately ? new Date() : null,
          },
        });

        return json({ 
          success: true, 
          message: cancelImmediately 
            ? "Subscription canceled immediately" 
            : "Subscription will cancel at end of billing period" 
        });
      }

      case "reactivate": {
        if (!subscription.stripeSubscriptionId) {
          return json({ error: "No subscription to reactivate" }, { status: 400 });
        }

        await reactivateStripeSubscription(subscription.stripeSubscriptionId);
        
        await db.subscription.update({
          where: { userId: user.id },
          data: {
            cancelAtPeriodEnd: false,
            canceledAt: null,
          },
        });

        return json({ success: true, message: "Subscription reactivated" });
      }

      case "upgrade":
      case "downgrade": {
        const newPlan = formData.get("plan") as string;
        
        if (!subscription.stripeSubscriptionId) {
          return json({ error: "No active subscription to change" }, { status: 400 });
        }

        if (!["STARTER", "PROFESSIONAL", "PREMIUM"].includes(newPlan)) {
          return json({ error: "Invalid plan" }, { status: 400 });
        }

        await changeSubscriptionPlan(subscription.stripeSubscriptionId, newPlan as any);
        
        // Update local subscription (webhook will also update this, but update immediately for better UX)
        const planConfig = PLAN_CONFIG[newPlan];
        
        await db.subscription.update({
          where: { userId: user.id },
          data: {
            planType: newPlan as any,
            interactionsAllowed: planConfig.interactions,
          },
        });

        return json({ success: true, message: `Subscription ${action === "upgrade" ? "upgraded" : "downgraded"} successfully` });
      }

      case "portal": {
        if (!subscription.stripeCustomerId) {
          return json({ error: "No Stripe customer found" }, { status: 400 });
        }

        const url = await createCustomerPortalSession(
          subscription.stripeCustomerId,
          `${process.env.BASE_URL || "http://localhost:8780"}/subscription/manage`
        );

        return redirect(url);
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Subscription action error:", error);
    return json({ 
      error: error.message || "An error occurred. Please try again." 
    }, { status: 500 });
  }
}

export default function SubscriptionManage() {
  const { user, subscription, invoices, stripeSubscription } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const formatCurrency = (amount: number, currency: string = "gbp") => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatPlanName = (plan: string) => {
    return plan.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getPlanInfo = (plan: string) => {
    const plans: Record<string, { name: string; price: string; interactions: string }> = {
      FREE: { name: "Free", price: "£0", interactions: "Limited" },
      STARTER: { name: "Starter", price: "£10/month", interactions: "1,000/month" },
      PROFESSIONAL: { name: "Professional", price: "£20/month", interactions: "2,500/month" },
      PREMIUM: { name: "Premium", price: "£50/month", interactions: "Unlimited" },
    };
    return plans[plan] || { name: plan, price: "Unknown", interactions: "Unknown" };
  };

  const currentPlan = getPlanInfo(subscription.planType);
  const canUpgrade = subscription.planType !== "PREMIUM";
  const canDowngrade = subscription.planType !== "FREE" && subscription.stripeSubscriptionId;

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Header */}
      <section className="py-12 bg-sunrise-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="text-sunrise-700 hover:text-sunrise-900 mb-4 inline-flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="heading-xl mb-4 text-charcoal-900">Subscription Management</h1>
          <p className="text-body text-charcoal-700 max-w-2xl">
            Manage your subscription, view invoices, and upgrade or downgrade your plan
          </p>
        </div>
      </section>

      {/* Action Messages */}
      {actionData?.success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl">
            {actionData.message}
          </div>
        </div>
      )}

      {actionData?.error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-peach-50 border border-peach-200 text-peach-800 px-4 py-3 rounded-xl">
            {actionData.error}
          </div>
        </div>
      )}

      {/* Current Subscription */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="heading-md mb-2">Current Plan</h2>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-charcoal-900">{currentPlan.name}</span>
                  <span className="text-lg text-charcoal-600">{currentPlan.price}</span>
                </div>
                <p className="text-sm text-charcoal-600 mt-2">
                  {currentPlan.interactions} interactions per month
                </p>
                {subscription.currentPeriodEnd && (
                  <p className="text-xs text-charcoal-500 mt-1">
                    Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="mt-4 md:mt-0">
                {subscription.status === "ACTIVE" && subscription.cancelAtPeriodEnd && (
                  <div className="bg-peach-50 border border-peach-200 text-peach-800 px-4 py-2 rounded-lg mb-4">
                    <p className="text-sm font-medium">
                      Subscription will cancel on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "end of period"}
                    </p>
                  </div>
                )}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  subscription.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                  subscription.status === "CANCELED" ? "bg-gray-100 text-gray-800" :
                  "bg-peach-100 text-peach-800"
                }`}>
                  {subscription.status}
                </span>
              </div>
            </div>

            {/* Usage Stats */}
            {subscription.interactionsAllowed !== null && (
              <div className="bg-sunrise-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-charcoal-700">Interactions This Month</span>
                  <span className="text-sm text-charcoal-600">
                    {subscription.interactionsUsed || 0} / {subscription.interactionsAllowed.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-sunrise-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((subscription.interactionsUsed || 0) / subscription.interactionsAllowed) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-charcoal-600 mt-2">
                  {subscription.interactionsAllowed - (subscription.interactionsUsed || 0)} remaining this month
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {subscription.status === "ACTIVE" && !subscription.cancelAtPeriodEnd && (
                <Form method="post">
                  <input type="hidden" name="action" value="cancel" />
                  <input type="hidden" name="cancelImmediately" value="false" />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-secondary"
                  >
                    Cancel Subscription
                  </button>
                </Form>
              )}

              {subscription.cancelAtPeriodEnd && (
                <Form method="post">
                  <input type="hidden" name="action" value="reactivate" />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    Reactivate Subscription
                  </button>
                </Form>
              )}

              {subscription.stripeCustomerId && (
                <Form method="post">
                  <input type="hidden" name="action" value="portal" />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-secondary"
                  >
                    Manage in Stripe Portal
                  </button>
                </Form>
              )}

              {subscription.planType === "FREE" && (
                <Link to="/pricing" className="btn-primary">
                  Upgrade Plan
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Upgrade/Downgrade Options */}
      {canUpgrade || canDowngrade ? (
        <section className="py-8 bg-sunrise-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="heading-lg mb-6">
              {canUpgrade && canDowngrade ? "Change Plan" : canUpgrade ? "Upgrade Plan" : "Downgrade Plan"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscription.planType === "FREE" && (
                <>
                  <div className="card">
                    <h3 className="heading-md mb-2">Starter</h3>
                    <div className="text-2xl font-bold mb-4">£10/month</div>
                    <p className="text-sm text-charcoal-600 mb-4">1,000 interactions/month</p>
                    <Form method="post">
                      <input type="hidden" name="action" value="upgrade" />
                      <input type="hidden" name="plan" value="STARTER" />
                      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                        Select Starter
                      </button>
                    </Form>
                  </div>
                  <div className="card">
                    <h3 className="heading-md mb-2">Professional</h3>
                    <div className="text-2xl font-bold mb-4">£20/month</div>
                    <p className="text-sm text-charcoal-600 mb-4">2,500 interactions/month</p>
                    <Form method="post">
                      <input type="hidden" name="action" value="upgrade" />
                      <input type="hidden" name="plan" value="PROFESSIONAL" />
                      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                        Select Professional
                      </button>
                    </Form>
                  </div>
                  <div className="card border-2 border-sunrise-500">
                    <div className="bg-sunrise-100 text-sunrise-800 text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2">
                      BEST VALUE
                    </div>
                    <h3 className="heading-md mb-2">Premium</h3>
                    <div className="text-2xl font-bold mb-4">£50/month</div>
                    <p className="text-sm text-charcoal-600 mb-4">Unlimited interactions</p>
                    <Form method="post">
                      <input type="hidden" name="action" value="upgrade" />
                      <input type="hidden" name="plan" value="PREMIUM" />
                      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                        Select Premium
                      </button>
                    </Form>
                  </div>
                </>
              )}

              {/* Upgrade options for STARTER and PROFESSIONAL */}
              {subscription.planType === "STARTER" && subscription.stripeSubscriptionId && (
                <>
                  <div className="card">
                    <h3 className="heading-md mb-2">Professional</h3>
                    <div className="text-2xl font-bold mb-4">£20/month</div>
                    <p className="text-sm text-charcoal-600 mb-4">2,500 interactions/month</p>
                    <Form method="post">
                      <input type="hidden" name="action" value="upgrade" />
                      <input type="hidden" name="plan" value="PROFESSIONAL" />
                      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                        Upgrade to Professional
                      </button>
                    </Form>
                  </div>
                  <div className="card border-2 border-sunrise-500">
                    <div className="bg-sunrise-100 text-sunrise-800 text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2">
                      BEST VALUE
                    </div>
                    <h3 className="heading-md mb-2">Premium</h3>
                    <div className="text-2xl font-bold mb-4">£50/month</div>
                    <p className="text-sm text-charcoal-600 mb-4">Unlimited interactions</p>
                    <Form method="post">
                      <input type="hidden" name="action" value="upgrade" />
                      <input type="hidden" name="plan" value="PREMIUM" />
                      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                        Upgrade to Premium
                      </button>
                    </Form>
                  </div>
                </>
              )}

              {subscription.planType === "PROFESSIONAL" && subscription.stripeSubscriptionId && (
                <div className="card border-2 border-sunrise-500">
                  <div className="bg-sunrise-100 text-sunrise-800 text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2">
                    BEST VALUE
                  </div>
                  <h3 className="heading-md mb-2">Premium</h3>
                  <div className="text-2xl font-bold mb-4">£50/month</div>
                  <p className="text-sm text-charcoal-600 mb-4">Unlimited interactions</p>
                  <Form method="post">
                    <input type="hidden" name="action" value="upgrade" />
                    <input type="hidden" name="plan" value="PREMIUM" />
                    <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                      Upgrade to Premium
                    </button>
                  </Form>
                </div>
              )}

              {/* Downgrade options */}
              {canDowngrade && subscription.stripeSubscriptionId && (
                <>
                  {subscription.planType === "PREMIUM" && (
                    <>
                      <div className="card">
                        <h3 className="heading-md mb-2">Professional</h3>
                        <div className="text-2xl font-bold mb-4">£20/month</div>
                        <p className="text-sm text-charcoal-600 mb-4">2,500 interactions/month</p>
                        <Form method="post">
                          <input type="hidden" name="action" value="downgrade" />
                          <input type="hidden" name="plan" value="PROFESSIONAL" />
                          <button type="submit" disabled={isSubmitting} className="btn-secondary w-full">
                            Downgrade to Professional
                          </button>
                        </Form>
                      </div>
                      <div className="card">
                        <h3 className="heading-md mb-2">Starter</h3>
                        <div className="text-2xl font-bold mb-4">£10/month</div>
                        <p className="text-sm text-charcoal-600 mb-4">1,000 interactions/month</p>
                        <Form method="post">
                          <input type="hidden" name="action" value="downgrade" />
                          <input type="hidden" name="plan" value="STARTER" />
                          <button type="submit" disabled={isSubmitting} className="btn-secondary w-full">
                            Downgrade to Starter
                          </button>
                        </Form>
                      </div>
                    </>
                  )}
                  {subscription.planType === "PROFESSIONAL" && (
                    <div className="card">
                      <h3 className="heading-md mb-2">Starter</h3>
                      <div className="text-2xl font-bold mb-4">£10/month</div>
                      <p className="text-sm text-charcoal-600 mb-4">1,000 interactions/month</p>
                      <Form method="post">
                        <input type="hidden" name="action" value="downgrade" />
                        <input type="hidden" name="plan" value="STARTER" />
                        <button type="submit" disabled={isSubmitting} className="btn-secondary w-full">
                          Downgrade to Starter
                        </button>
                      </Form>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* Invoice History */}
      {invoices.length > 0 && (
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="heading-lg mb-6">Invoice History</h2>
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal-700">Invoice #</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-gray-100 hover:bg-sunrise-50">
                        <td className="py-3 px-4 text-sm text-charcoal-900">{invoice.number || invoice.id.slice(-8)}</td>
                        <td className="py-3 px-4 text-sm text-charcoal-600">
                          {invoice.created.toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-charcoal-900">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === "paid" ? "bg-green-100 text-green-800" :
                            invoice.status === "open" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {invoice.hostedInvoiceUrl && (
                              <a
                                href={invoice.hostedInvoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sunrise-600 hover:text-sunrise-700 text-sm font-medium"
                              >
                                View
                              </a>
                            )}
                            {invoice.invoicePdf && (
                              <a
                                href={invoice.invoicePdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sunrise-600 hover:text-sunrise-700 text-sm font-medium"
                              >
                                Download PDF
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {invoices.length === 0 && subscription.stripeCustomerId && (
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card text-center">
              <p className="text-charcoal-600">No invoices yet</p>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

