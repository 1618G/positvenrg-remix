import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { createCheckoutSession } from "~/lib/stripe.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Verify authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];
  
  if (!token) {
    return redirect("/login?redirect=/pricing");
  }

  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login?redirect=/pricing");
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return redirect("/login");
  }

  const planType = params.planType?.toUpperCase();
  if (!planType || !["STARTER", "PROFESSIONAL", "PREMIUM"].includes(planType)) {
    return redirect("/pricing?error=invalid-plan");
  }

  try {
    const checkoutUrl = await createCheckoutSession(session.userId, planType as any);
    return redirect(checkoutUrl);
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return redirect("/pricing?error=checkout-failed");
  }
}

