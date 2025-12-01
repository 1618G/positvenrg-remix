import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import { getActiveCompanions } from "~/lib/companion.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import { LegalDisclaimer } from "~/components/LegalDisclaimer";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const verified = url.searchParams.get("verified") === "true";
  const minRating = url.searchParams.get("minRating") ? parseFloat(url.searchParams.get("minRating")!) : undefined;
  const maxPrice = url.searchParams.get("maxPrice") ? parseFloat(url.searchParams.get("maxPrice")!) : undefined;
  const tags = url.searchParams.get("tags")?.split(",").filter(Boolean);

  const companions = await getActiveCompanions({
    verified: verified || undefined,
    minRating,
    maxPrice,
    tags,
    limit: 50,
  });

  return json({ companions });
}

export default function HumanCompanions() {
  const { companions } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    verified: searchParams.get("verified") === "true",
    minRating: searchParams.get("minRating") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    tags: searchParams.get("tags") || "",
  });

  const updateFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.verified) params.set("verified", "true");
    if (newFilters.minRating) params.set("minRating", newFilters.minRating);
    if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice);
    if (newFilters.tags) params.set("tags", newFilters.tags);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Disclaimer Banner */}
      <div className="bg-white border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <LegalDisclaimer variant="inline" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="heading-xl mb-4">Human Companions</h1>
          <p className="text-body text-charcoal-600">
            Connect with real people for friendly conversation and support
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <h2 className="heading-md mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => updateFilters({ ...filters, verified: e.target.checked })}
                  className="rounded border-charcoal-300"
                />
                <span className="text-sm text-charcoal-700">Verified Only</span>
              </label>
            </div>

            <div>
              <label className="block text-sm text-charcoal-700 mb-1">Min Rating</label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={filters.minRating}
                onChange={(e) => updateFilters({ ...filters, minRating: e.target.value })}
                className="w-full px-3 py-2 border border-charcoal-300 rounded-lg text-sm"
                placeholder="Any"
              />
            </div>

            <div>
              <label className="block text-sm text-charcoal-700 mb-1">Max Price/Hour</label>
              <input
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(e) => updateFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full px-3 py-2 border border-charcoal-300 rounded-lg text-sm"
                placeholder="Any"
              />
            </div>

            <div>
              <button
                onClick={() => updateFilters({ verified: false, minRating: "", maxPrice: "", tags: "" })}
                className="btn-secondary text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Companions Grid */}
        {companions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-charcoal-600">No companions found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companions.map((companion) => (
              <Link
                key={companion.id}
                to={`/companions/human/${companion.id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start space-x-4 mb-4">
                  {companion.avatar && (
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                      {companion.avatar}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="heading-md">{companion.displayName}</h3>
                      {companion.isVerified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    {companion.rating && (
                      <div className="flex items-center space-x-1 text-sm text-charcoal-600 mb-2">
                        <span>⭐</span>
                        <span>{companion.rating.toFixed(1)}</span>
                        <span className="text-charcoal-400">
                          ({companion._count.reviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {companion.bio && (
                  <p className="text-sm text-charcoal-600 mb-4 line-clamp-2">{companion.bio}</p>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-charcoal-900">
                      £{(companion.pricePerHour / 100).toFixed(2)}/hour
                    </p>
                    <p className="text-xs text-charcoal-500">
                      Min: {companion.minimumDuration} min
                    </p>
                  </div>
                  <span className="btn-primary text-sm">Book Now</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

