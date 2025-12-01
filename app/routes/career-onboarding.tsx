import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import type { OnboardingData } from "~/lib/types.server";

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

  // Get existing career context if any
  const onboardingData = ((user?.onboardingData as unknown) as OnboardingData | null) || {};
  const careerContext = onboardingData.careerContext || {};

  return json({ user, careerContext });
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

  const user = await getUserById(session.userId);
  if (!user) {
    return redirect("/login");
  }

  const formData = await request.formData();
  
  const parseJsonField = (value: string | null, defaultValue: any = []) => {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  };

  // Get existing onboarding data
  const existingData = (user as any).onboardingData || {};
  
  // Build career context
  const careerContext = {
    industry: formData.get("industry") as string || undefined,
    jobTitle: formData.get("jobTitle") as string || undefined,
    experienceLevel: formData.get("experienceLevel") as string || undefined,
    currentSituation: formData.get("currentSituation") as string || undefined,
    careerGoals: formData.get("careerGoals") as string || undefined,
    location: formData.get("location") as string || undefined,
    targetLocations: parseJsonField(formData.get("targetLocations") as string | null, []),
    relocationOpen: formData.get("relocationOpen") === "true",
    visaConsiderations: formData.get("visaConsiderations") === "true",
    visaDetails: formData.get("visaDetails") as string || undefined,
    interests: parseJsonField(formData.get("interests") as string | null, []),
  };

  // Update onboarding data with career context
  const updatedOnboardingData = {
    ...existingData,
    careerContext,
  };

  await db.user.update({
    where: { id: user.id },
    data: {
      onboardingData: updatedOnboardingData as OnboardingData,
    },
  });

  const redirectTo = formData.get("redirectTo") as string || "/dashboard";
  return redirect(redirectTo);
}

export default function CareerOnboarding() {
  const { user, careerContext } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedInterests, setSelectedInterests] = useState<string[]>(careerContext.interests || []);
  const [targetLocations, setTargetLocations] = useState<string[]>(careerContext.targetLocations || []);
  const [locationInput, setLocationInput] = useState("");

  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "Marketing",
    "Consulting",
    "Engineering",
    "Sales",
    "Education",
    "Legal",
    "Creative",
    "Manufacturing",
    "Retail",
    "Hospitality",
    "Other",
  ];

  const experienceLevels = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (3-7 years)" },
    { value: "senior", label: "Senior Level (8+ years)" },
    { value: "executive", label: "Executive/C-Level" },
  ];

  const situations = [
    "Job Searching",
    "Career Change",
    "Seeking Promotion",
    "Relocating",
    "Exploring Options",
    "Skill Development",
    "Other",
  ];

  const interestOptions = [
    "Resume Optimization",
    "Interview Preparation",
    "Salary Negotiation",
    "Skill Development",
    "Career Transitions",
    "Networking",
    "Workplace Dynamics",
    "Relocation",
    "Visa & Immigration",
  ];

  const toggleSelection = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const addLocation = () => {
    if (locationInput.trim() && !targetLocations.includes(locationInput.trim())) {
      setTargetLocations([...targetLocations, locationInput.trim()]);
      setLocationInput("");
    }
  };

  const removeLocation = (location: string) => {
    setTargetLocations(targetLocations.filter(l => l !== location));
  };

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      <section className="py-16 bg-electric-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-xl mb-6 text-charcoal-900">
            Career Information
          </h1>
          <p className="text-body text-charcoal-700 max-w-2xl mx-auto">
            Help Jobe provide personalized career advice by sharing your professional background
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Form method="post" className="space-y-8">
            <input type="hidden" name="redirectTo" value="/companions" />

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-charcoal-700 mb-2">
                What industry are you in? *
              </label>
              <select
                id="industry"
                name="industry"
                required
                defaultValue={careerContext.industry || ""}
                className="input"
              >
                <option value="">Select an industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry.toLowerCase()}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Title */}
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-charcoal-700 mb-2">
                Current Job Title
              </label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                defaultValue={careerContext.jobTitle || ""}
                className="input"
                placeholder="e.g., Software Engineer, Marketing Manager"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label htmlFor="experienceLevel" className="block text-sm font-medium text-charcoal-700 mb-2">
                Experience Level
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                defaultValue={careerContext.experienceLevel || ""}
                className="input"
              >
                <option value="">Select experience level</option>
                {experienceLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Situation */}
            <div>
              <label htmlFor="currentSituation" className="block text-sm font-medium text-charcoal-700 mb-2">
                Current Career Situation
              </label>
              <select
                id="currentSituation"
                name="currentSituation"
                defaultValue={careerContext.currentSituation || ""}
                className="input"
              >
                <option value="">Select your situation</option>
                {situations.map(situation => (
                  <option key={situation} value={situation.toLowerCase().replace(/\s+/g, "_")}>
                    {situation}
                  </option>
                ))}
              </select>
            </div>

            {/* Career Goals */}
            <div>
              <label htmlFor="careerGoals" className="block text-sm font-medium text-charcoal-700 mb-2">
                Career Goals
              </label>
              <textarea
                id="careerGoals"
                name="careerGoals"
                rows={4}
                defaultValue={careerContext.careerGoals || ""}
                className="input"
                placeholder="e.g., Transition to leadership role, switch to tech industry, relocate to UK..."
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-charcoal-700 mb-2">
                Current Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                defaultValue={careerContext.location || ""}
                className="input"
                placeholder="e.g., London, UK"
              />
            </div>

            {/* Relocation */}
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Are you open to relocation?
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="relocationOpen"
                    value="true"
                    defaultChecked={careerContext.relocationOpen === true}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="relocationOpen"
                    value="false"
                    defaultChecked={careerContext.relocationOpen === false || careerContext.relocationOpen === undefined}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>

            {/* Target Locations */}
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Target Locations (if relocating)
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLocation();
                    }
                  }}
                  className="input flex-1"
                  placeholder="e.g., Remote, Manchester, New York"
                />
                <button
                  type="button"
                  onClick={addLocation}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              <input
                type="hidden"
                name="targetLocations"
                value={JSON.stringify(targetLocations)}
              />
              {targetLocations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {targetLocations.map((loc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-electric-100 text-electric-800"
                    >
                      {loc}
                      <button
                        type="button"
                        onClick={() => removeLocation(loc)}
                        className="ml-2 text-electric-600 hover:text-electric-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Visa Considerations */}
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Do you have visa considerations?
              </label>
              <div className="flex space-x-4 mb-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visaConsiderations"
                    value="true"
                    defaultChecked={careerContext.visaConsiderations === true}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visaConsiderations"
                    value="false"
                    defaultChecked={careerContext.visaConsiderations === false || careerContext.visaConsiderations === undefined}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
              {careerContext.visaConsiderations && (
                <textarea
                  name="visaDetails"
                  rows={3}
                  defaultValue={careerContext.visaDetails || ""}
                  className="input"
                  placeholder="Please provide details about your visa situation..."
                />
              )}
            </div>

            {/* Career Interests */}
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                What career topics interest you? (Select all that apply)
              </label>
              <input
                type="hidden"
                name="interests"
                value={JSON.stringify(selectedInterests)}
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interestOptions.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleSelection(selectedInterests, setSelectedInterests, interest)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedInterests.includes(interest)
                        ? "bg-electric-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {actionData?.error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                {actionData.error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="btn-secondary"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? "Saving..." : "Save Career Information"}
              </button>
            </div>
          </Form>
        </div>
      </section>

      <Footer />
    </div>
  );
}


