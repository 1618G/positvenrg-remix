import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { saveOnboardingData, isOnboardingCompleted } from "~/lib/onboarding.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify authentication
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

  // Check if onboarding already completed
  const completed = await isOnboardingCompleted(session.userId);
  if (completed) {
    return redirect("/dashboard");
  }

  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  // Verify authentication
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

  const formData = await request.formData();
  
  try {
    const onboardingData = {
      communicationStyle: formData.get("communicationStyle") as string,
      responseLength: formData.get("responseLength") as string,
      formality: formData.get("formality") as string,
      primaryNeeds: JSON.parse(formData.get("primaryNeeds") as string || "[]"),
      goals: formData.get("goals") as string,
      triggers: JSON.parse(formData.get("triggers") as string || "[]"),
      sensitivities: formData.get("sensitivities") as string || undefined,
      preferredCompanions: JSON.parse(formData.get("preferredCompanions") as string || "[]"),
      dailyRoutine: formData.get("dailyRoutine") as string || undefined,
      challenges: formData.get("challenges") as string || undefined,
      sharePersonalInfo: formData.get("sharePersonalInfo") === "true",
      reminderPreferences: formData.get("reminderPreferences") ? JSON.parse(formData.get("reminderPreferences") as string) : undefined,
    };

    await saveOnboardingData(session.userId, onboardingData as any);
    
    return redirect("/dashboard");
  } catch (error) {
    return json(
      { 
        error: error instanceof Error ? error.message : "Failed to save onboarding data. Please try again." 
      },
      { status: 400 }
    );
  }
}

export default function Onboarding() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedCompanions, setSelectedCompanions] = useState<string[]>([]);
  
  const totalSteps = 5;
  
  const needsOptions = [
    "Stress Management",
    "Grief Support",
    "Motivation & Goals",
    "Sleep Improvement",
    "Emotional Processing",
    "Daily Encouragement",
    "Mindfulness & Calm",
    "Productivity Help",
  ];
  
  const triggerOptions = [
    "Anxiety",
    "Depression",
    "Grief/Loss",
    "Work Stress",
    "Relationship Issues",
    "Health Concerns",
    "Financial Worries",
    "None of the above",
  ];
  
  const companionOptions = [
    { id: "calmflow", name: "CalmFlow", description: "Gentle breathing and mindfulness" },
    { id: "grace", name: "Grace", description: "Compassionate grief support" },
    { id: "spark", name: "Spark", description: "Motivation and goal achievement" },
    { id: "luna", name: "Luna", description: "Nighttime comfort and rest" },
    { id: "echo", name: "Echo", description: "Active listening and reflection" },
    { id: "sunny", name: "Sunny", description: "Cheerful mood boost" },
  ];

  const toggleSelection = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-charcoal-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-charcoal-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-sunrise-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Onboarding Form */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-pastel-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="heading-xl mb-4 text-charcoal-900">
                Let's Get to Know You
              </h1>
              <p className="text-body text-charcoal-700 max-w-2xl mx-auto">
                We'll personalize your AI companion experience based on your preferences, needs, and goals.
              </p>
            </div>

            {actionData?.error && (
              <div className="mb-6 bg-peach-50 border border-peach-200 text-peach-800 px-4 py-3 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {actionData.error}
                </div>
              </div>
            )}

            <Form method="post" id="onboarding-form">
              {/* Step 1: Communication Style */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="heading-lg text-center">How do you prefer to communicate?</h2>
                  <p className="text-body text-charcoal-600 text-center mb-8">
                    This helps us tailor responses to your style
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { value: "direct", label: "Direct", desc: "Straightforward and clear" },
                      { value: "gentle", label: "Gentle", desc: "Soft and compassionate" },
                      { value: "encouraging", label: "Encouraging", desc: "Positive and motivating" },
                      { value: "listening", label: "Listening", desc: "Reflective and thoughtful" },
                    ].map((style) => (
                      <label
                        key={style.value}
                        className="relative flex items-start p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-sunrise-300 transition-colors"
                      >
                        <input
                          type="radio"
                          name="communicationStyle"
                          value={style.value}
                          required
                          className="sr-only peer"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-charcoal-900 mb-1">{style.label}</div>
                          <div className="text-sm text-charcoal-600">{style.desc}</div>
                        </div>
                        <div className="ml-3 w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-sunrise-500 peer-checked:bg-sunrise-500 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full hidden peer-checked:block"></div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        Response Length
                      </label>
                      <select name="responseLength" className="input" required>
                        <option value="brief">Brief (Quick responses)</option>
                        <option value="moderate" selected>Moderate (Balanced detail)</option>
                        <option value="detailed">Detailed (Comprehensive responses)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        Formality Level
                      </label>
                      <select name="formality" className="input" required>
                        <option value="casual" selected>Casual (Friendly and relaxed)</option>
                        <option value="professional">Professional (Respectful and formal)</option>
                        <option value="friendly">Friendly (Warm but balanced)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Needs */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="heading-lg text-center">What do you need support with?</h2>
                  <p className="text-body text-charcoal-600 text-center mb-8">
                    Select all that apply (at least one required)
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {needsOptions.map((need) => (
                      <label
                        key={need}
                        onClick={() => toggleSelection(selectedNeeds, setSelectedNeeds, need)}
                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedNeeds.includes(need)
                            ? "border-sunrise-500 bg-sunrise-50"
                            : "border-gray-200 hover:border-sunrise-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="primaryNeeds"
                          value={need}
                          checked={selectedNeeds.includes(need)}
                          onChange={() => {}}
                          className="sr-only"
                        />
                        <div className="flex-1 font-medium text-charcoal-900">{need}</div>
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          selectedNeeds.includes(need)
                            ? "border-sunrise-500 bg-sunrise-500"
                            : "border-gray-300"
                        }`}>
                          {selectedNeeds.includes(need) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  <input type="hidden" name="primaryNeeds" value={JSON.stringify(selectedNeeds)} />
                </div>
              )}

              {/* Step 3: Goals & Challenges */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="heading-lg text-center">Tell us about your goals</h2>
                  <p className="text-body text-charcoal-600 text-center mb-8">
                    Help us understand what you're working towards
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      What are your main goals or what would you like to achieve? *
                    </label>
                    <textarea
                      name="goals"
                      rows={5}
                      className="input"
                      placeholder="Example: I want to reduce stress, improve my sleep, and feel more motivated in my daily life..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      What challenges are you currently facing? (Optional)
                    </label>
                    <textarea
                      name="challenges"
                      rows={4}
                      className="input"
                      placeholder="Example: Work deadlines, relationship stress, health concerns..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Describe your daily routine (Optional)
                    </label>
                    <textarea
                      name="dailyRoutine"
                      rows={3}
                      className="input"
                      placeholder="Example: I work 9-5, exercise in the morning, and have trouble sleeping..."
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Triggers & Sensitivities */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="heading-lg text-center">Any triggers or sensitivities?</h2>
                  <p className="text-body text-charcoal-600 text-center mb-8">
                    Help us avoid topics that might be difficult for you
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {triggerOptions.map((trigger) => (
                      <label
                        key={trigger}
                        onClick={() => toggleSelection(selectedTriggers, setSelectedTriggers, trigger)}
                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedTriggers.includes(trigger)
                            ? "border-sunrise-500 bg-sunrise-50"
                            : "border-gray-200 hover:border-sunrise-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="triggers"
                          value={trigger}
                          checked={selectedTriggers.includes(trigger)}
                          onChange={() => {}}
                          className="sr-only"
                        />
                        <div className="flex-1 font-medium text-charcoal-900">{trigger}</div>
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          selectedTriggers.includes(trigger)
                            ? "border-sunrise-500 bg-sunrise-500"
                            : "border-gray-300"
                        }`}>
                          {selectedTriggers.includes(trigger) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  <input type="hidden" name="triggers" value={JSON.stringify(selectedTriggers)} />
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Additional sensitivities or notes (Optional)
                    </label>
                    <textarea
                      name="sensitivities"
                      rows={3}
                      className="input"
                      placeholder="Anything else we should know about topics to avoid or approach carefully..."
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Companion Preferences & Final */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <h2 className="heading-lg text-center">Companion Preferences</h2>
                  <p className="text-body text-charcoal-600 text-center mb-8">
                    Which companions interest you most? (Optional - you can chat with any companion)
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {companionOptions.map((companion) => (
                      <label
                        key={companion.id}
                        onClick={() => toggleSelection(selectedCompanions, setSelectedCompanions, companion.id)}
                        className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedCompanions.includes(companion.id)
                            ? "border-sunrise-500 bg-sunrise-50"
                            : "border-gray-200 hover:border-sunrise-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="preferredCompanions"
                          value={companion.id}
                          checked={selectedCompanions.includes(companion.id)}
                          onChange={() => {}}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-charcoal-900 mb-1">{companion.name}</div>
                          <div className="text-sm text-charcoal-600">{companion.description}</div>
                        </div>
                        <div className={`ml-3 w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedCompanions.includes(companion.id)
                            ? "border-sunrise-500 bg-sunrise-500"
                            : "border-gray-300"
                        }`}>
                          {selectedCompanions.includes(companion.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  <input type="hidden" name="preferredCompanions" value={JSON.stringify(selectedCompanions)} />
                  <input type="hidden" name="sharePersonalInfo" value="false" />
                  
                  <div className="bg-pastel-50 border border-pastel-200 rounded-xl p-6">
                    <h3 className="font-semibold text-pastel-800 mb-2">You're almost done!</h3>
                    <p className="text-sm text-pastel-700">
                      Once you complete onboarding, we'll personalize your AI companion experience based on your responses. 
                      You can always update your preferences later in your profile settings.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className={`btn-secondary ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Previous
                </button>
                
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={() => {
                      // Validate current step before proceeding
                      if (currentStep === 2 && selectedNeeds.length === 0) {
                        alert("Please select at least one need");
                        return;
                      }
                      setCurrentStep(currentStep + 1);
                    }}
                    className="btn-primary"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || (currentStep === 2 && selectedNeeds.length === 0)}
                    className={`btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      "Complete Onboarding"
                    )}
                  </button>
                )}
              </div>
            </Form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}



