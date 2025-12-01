import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getCompanionProfile } from "~/lib/companion.server";
import { db } from "~/lib/db.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import { LegalDisclaimer } from "~/components/LegalDisclaimer";
import { verifyUserSession, getUserById } from "~/lib/auth.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const companionId = params.id;
  if (!companionId) {
    return redirect("/companions/human");
  }

  const companion = await getCompanionProfile(companionId);
  if (!companion || !companion.isActive) {
    return redirect("/companions/human?error=not_found");
  }

  // Get reviews
  const reviews = await db.companionReview.findMany({
    where: {
      companionId,
      isPublic: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Check if user is authenticated (for booking button)
  let isAuthenticated = false;
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (token) {
    const session = verifyUserSession(token);
    if (session) {
      const user = await getUserById(session.userId);
      isAuthenticated = !!user;
    }
  }

  return json({ companion, reviews, isAuthenticated });
}

export default function HumanCompanionProfile() {
  const { companion, reviews, isAuthenticated } = useLoaderData<typeof loader>();

  const pricePerHour = (companion.pricePerHour / 100).toFixed(2);

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
        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex items-start space-x-6">
            {companion.avatar && (
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-4xl flex-shrink-0">
                {companion.avatar}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="heading-xl">{companion.displayName}</h1>
                {companion.isVerified && (
                  <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
              {companion.rating && (
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">⭐</span>
                  <span className="text-xl font-semibold">{companion.rating.toFixed(1)}</span>
                  <span className="text-charcoal-600">
                    ({companion._count.reviews} reviews)
                  </span>
                </div>
              )}
              <p className="text-lg font-semibold text-charcoal-900 mb-4">
                £{pricePerHour}/hour
              </p>
              {companion.bio && (
                <p className="text-body text-charcoal-600 mb-4">{companion.bio}</p>
              )}
              {companion.tags && Array.isArray(companion.tags) && companion.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {(companion.tags as string[]).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-sunrise-100 text-sunrise-800 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-6">
                {isAuthenticated ? (
                  <Link
                    to={`/book/${companion.id}`}
                    className="btn-primary text-lg px-8 py-4"
                  >
                    Book Appointment
                  </Link>
                ) : (
                  <Link
                    to={`/login?redirect=/book/${companion.id}`}
                    className="btn-primary text-lg px-8 py-4"
                  >
                    Sign In to Book
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="card">
            <h2 className="heading-md mb-6">Reviews</h2>
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-charcoal-200 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-charcoal-900">
                          {review.user.name || "Anonymous"}
                        </span>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={i < review.rating ? "text-yellow-400" : "text-gray-300"}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-charcoal-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {review.reviewText && (
                    <p className="text-body text-charcoal-700 mt-2">{review.reviewText}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

