import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { createUser, createUserSession, verifyUserSession, getUserById } from "~/lib/auth.server";
import { generateVerificationCode } from "~/lib/email.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const step = formData.get("step") as string;

    console.log("[REGISTER] Step received:", step);
    console.log("[REGISTER] Form data keys:", Array.from(formData.keys()));

    if (!step) {
      console.error("[REGISTER] Missing step parameter");
      return json(
        { error: "Invalid request. Please try again.", step: 1 },
        { status: 400 }
      );
    }

    // Step 1: Create account with email and password
    if (step === "1") {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const name = formData.get("name") as string;

      console.log("[REGISTER STEP 1] Email:", email ? "provided" : "missing");
      console.log("[REGISTER STEP 1] Password:", password ? `provided (length: ${password.length})` : "missing");
      console.log("[REGISTER STEP 1] Name:", name || "not provided");

      if (!email || !password) {
        console.error("[REGISTER STEP 1] Missing email or password");
        return json(
          { error: "Email and password are required", step: 1 },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        console.error("[REGISTER STEP 1] Password too short");
        return json(
          { error: "Password must be at least 6 characters", step: 1 },
          { status: 400 }
        );
      }

      try {
        console.log("[REGISTER STEP 1] Creating user...");
        const user = await createUser(email, password, name || undefined);
        console.log("[REGISTER STEP 1] User created:", user.id);
        
        // Store user ID in session/cookie for step 2
        const token = require("~/lib/auth.server").createUserSession(user.id);
        console.log("[REGISTER STEP 1] Session token created");
        
        return json(
          { 
            success: true, 
            step: 2, 
            userId: user.id,
            token 
          },
          {
            headers: {
              "Set-Cookie": `temp_signup_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`,
            },
          }
        );
      } catch (error: any) {
        console.error("[REGISTER STEP 1] Error creating user:", error);
        
        // Check if it's a unique constraint error (email already exists)
        if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
          return json(
            { error: "This email is already registered. Please use a different email or sign in instead.", step: 1 },
            { status: 400 }
          );
        }
        
        return json(
          { error: error.message || "An error occurred while creating your account. Please try again.", step: 1 },
          { status: 400 }
        );
      }
    }

    // Step 2: Save profile info and send verification email
    if (step === "2") {
      try {
      const cookieHeader = request.headers.get("Cookie");
      const token = cookieHeader
        ?.split(";")
        .find(c => c.trim().startsWith("temp_signup_token="))
        ?.split("=")[1];
      
      if (!token) {
        return json(
          { error: "Session expired. Please start over.", step: 1 },
          { status: 400 }
        );
      }

      const { verifyUserSession, getUserById } = require("~/lib/auth.server");
      const session = verifyUserSession(token);
      if (!session) {
        return json(
          { error: "Invalid session. Please start over.", step: 1 },
          { status: 400 }
        );
      }

      const user = await getUserById(session.userId);
      if (!user) {
        return json(
          { error: "User not found", step: 1 },
          { status: 400 }
        );
      }

      const location = formData.get("location") as string;
      const ageRange = formData.get("ageRange") as string;
      const interests = formData.get("interests") as string;

      // Update user with profile info
      const { db } = require("~/lib/db.server");
      
      // Parse interests safely
      let parsedInterests = null;
      if (interests && interests.trim()) {
        try {
          parsedInterests = JSON.parse(interests);
          // Ensure it's an array
          if (!Array.isArray(parsedInterests)) {
            parsedInterests = [];
          }
        } catch (e) {
          // If parsing fails, default to empty array
          parsedInterests = [];
        }
      }
      
      // Generate 6-digit verification code
      const verificationCode = generateVerificationCode();
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24); // 24 hour expiry
      
      await db.user.update({
        where: { id: user.id },
        data: {
          location: location || null,
          ageRange: ageRange || null,
          interests: parsedInterests,
          verificationToken: verificationCode,
          verificationTokenExpiry: expiry,
        },
      });

      return json({ 
        success: true, 
        step: 3, 
        email: user.email,
        verificationCode // Send code to display on screen
      });
      } catch (error: any) {
        console.error("Error in step 2:", error);
        return json(
          { error: error.message || "An error occurred. Please try again.", step: 2 },
          { status: 500 }
        );
      }
    }

    // Step 3: Verify code
    if (step === "3") {
      const cookieHeader = request.headers.get("Cookie");
      const token = cookieHeader
        ?.split(";")
        .find(c => c.trim().startsWith("temp_signup_token="))
        ?.split("=")[1];
      
      if (!token) {
        return json(
          { error: "Session expired. Please start over.", step: 1 },
          { status: 400 }
        );
      }

      const { verifyUserSession, getUserById } = require("~/lib/auth.server");
      const session = verifyUserSession(token);
      if (!session) {
        return json(
          { error: "Invalid session. Please start over.", step: 1 },
          { status: 400 }
        );
      }

      const user = await getUserById(session.userId);
      if (!user || !user.verificationToken) {
        return json(
          { error: "Verification code not found. Please start over.", step: 1 },
          { status: 400 }
        );
      }

      const enteredCode = formData.get("code") as string;
      
      if (!enteredCode || enteredCode.length !== 6) {
        return json(
          { error: "Please enter the 6-digit code", step: 3, email: user.email, verificationCode: user.verificationToken },
          { status: 400 }
        );
      }

      // Check if code matches
      if (user.verificationToken !== enteredCode) {
        return json(
          { error: "Invalid verification code. Please try again.", step: 3, email: user.email, verificationCode: user.verificationToken },
          { status: 400 }
        );
      }

      // Check if code expired
      if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
        return json(
          { error: "Verification code has expired. Please start over.", step: 1 },
          { status: 400 }
        );
      }

      // Verify email and clear token
      const { db } = require("~/lib/db.server");
      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });

      // Create session and redirect to dashboard
      const sessionToken = createUserSession(user.id);
      
      return redirect("/dashboard", {
        headers: {
          "Set-Cookie": `token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
        },
      });
    }

    return json({ error: "Invalid step", step: 1 }, { status: 400 });
  } catch (error: any) {
    console.error("Unexpected error in register action:", error);
    return json(
      { error: error.message || "An unexpected error occurred. Please try again.", step: 1 },
      { status: 500 }
    );
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  // If user is on step 3 (verification), try to fetch their code from DB
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find(c => c.trim().startsWith("temp_signup_token="))
    ?.split("=")[1];
  
  if (token) {
    const session = verifyUserSession(token);
    if (session) {
      const user = await getUserById(session.userId);
      if (user?.verificationToken) {
        return json({ 
          verificationCode: user.verificationToken,
          email: user.email 
        });
      }
    }
  }
  
  return json({});
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [currentStep, setCurrentStep] = useState(actionData?.step || 1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // Use verification code from actionData if available, otherwise from loaderData
  const verificationCode = actionData?.verificationCode || loaderData?.verificationCode;
  const email = actionData?.email || loaderData?.email;
  
  // If we have a code but not on step 3, go to step 3
  useEffect(() => {
    if (verificationCode && currentStep !== 3) {
      setCurrentStep(3);
    }
  }, [verificationCode, currentStep]);

  const interestOptions = [
    "Health & Wellness",
    "Fitness & Exercise",
    "Mindfulness & Meditation",
    "Reading & Learning",
    "Music & Arts",
    "Travel & Adventure",
    "Cooking & Food",
    "Nature & Outdoors",
    "Technology",
    "Social Connections",
    "Creativity",
    "Sports",
  ];

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  // Update step when actionData changes
  if (actionData?.step && actionData.step !== currentStep) {
    setCurrentStep(actionData.step);
  }

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-16 bg-sunrise-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-xl mb-6 text-charcoal-900">
            Join PositiveNRG
          </h1>
          <p className="text-body text-charcoal-700 max-w-2xl mx-auto">
            Start your positive energy journey today with AI companions designed to support and uplift you
          </p>
        </div>
      </section>

      {/* Progress Bar */}
      {currentStep < 3 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-charcoal-700">
                Step {currentStep} of 2
              </span>
              <span className="text-sm text-charcoal-500">
                {Math.round((currentStep / 2) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-sunrise-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      {currentStep === 3 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-charcoal-700">
                Step 3 of 3
              </span>
              <span className="text-sm text-charcoal-500">
                100% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-sunrise-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `100%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <section className="py-16 bg-white">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          {/* Step 3: Verification Code */}
          {currentStep === 3 ? (
            <div className="card">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-pastel-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="heading-md mb-2 text-charcoal-900">
                  Enter Verification Code
                </h2>
                <p className="text-body text-charcoal-600">
                  Enter the 6-digit code below to verify your account
                </p>
              </div>

              {/* Display Code (for dummy verification) */}
              {verificationCode && (
                <div className="bg-sunrise-50 border-2 border-sunrise-200 rounded-xl p-6 mb-6 text-center">
                  <p className="text-sm font-medium text-charcoal-700 mb-2">
                    Your verification code is:
                  </p>
                  <div className="text-4xl font-bold text-sunrise-600 tracking-wider mb-2">
                    {verificationCode}
                  </div>
                  <p className="text-xs text-charcoal-600">
                    (Enter this code in the field below)
                  </p>
                </div>
              )}

              <Form method="post" className="space-y-6">
                <input type="hidden" name="step" value="3" />

                {actionData?.error && (
                  <div className="bg-peach-50 border border-peach-200 text-peach-800 px-4 py-3 rounded-xl">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {actionData.error}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-charcoal-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    className="input text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    autoFocus
                    onChange={(e) => {
                      // Only allow numbers and limit to 6 digits
                      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    }}
                  />
                  <p className="text-xs text-charcoal-500 mt-1">
                    Enter the 6-digit code shown above
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-primary w-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    "Verify & Complete Registration"
                  )}
                </button>
              </Form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-charcoal-600 hover:text-charcoal-900">
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-pastel-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="heading-md mb-2">
                  {currentStep === 1 ? "Create Your Account" : "Tell Us About Yourself"}
                </h2>
                <p className="text-body text-charcoal-600">
                  {currentStep === 1 
                    ? "Get started with your AI companions in just a few steps"
                    : "Help us personalize your experience"}
                </p>
              </div>

              <Form method="post" className="space-y-6">
                <input type="hidden" name="step" value={currentStep} />

                {actionData?.error && (
                  <div className="bg-peach-50 border border-peach-200 text-peach-800 px-4 py-3 rounded-xl">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {actionData.error}
                    </div>
                  </div>
                )}

                {/* Step 1: Email & Password */}
                {currentStep === 1 && (
                  <>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-charcoal-700 mb-2">
                        Name (Optional)
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="input"
                        placeholder="Enter your name"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="input"
                        placeholder="Enter your email address"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        className="input"
                        placeholder="Create a secure password"
                      />
                      <p className="text-xs text-charcoal-500 mt-1">
                        Must be at least 6 characters long
                      </p>
                    </div>
                  </>
                )}

                {/* Step 2: Profile Info */}
                {currentStep === 2 && (
                  <>
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-charcoal-700 mb-2">
                        Location (Optional)
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        className="input"
                        placeholder="City, Country"
                      />
                      <p className="text-xs text-charcoal-500 mt-1">
                        This helps us personalize content for your region
                      </p>
                    </div>

                    <div>
                      <label htmlFor="ageRange" className="block text-sm font-medium text-charcoal-700 mb-2">
                        Age Range (Optional)
                      </label>
                      <select id="ageRange" name="ageRange" className="input">
                        <option value="">Prefer not to say</option>
                        <option value="18-25">18-25</option>
                        <option value="26-35">26-35</option>
                        <option value="36-50">36-50</option>
                        <option value="50+">50+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        Interests (Optional)
                      </label>
                      <p className="text-xs text-charcoal-500 mb-3">
                        Select any that apply - helps us match you with the right companions
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {interestOptions.map((interest) => (
                          <label
                            key={interest}
                            className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                              selectedInterests.includes(interest)
                                ? "border-sunrise-500 bg-sunrise-50"
                                : "border-gray-200 hover:border-sunrise-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              name="interests"
                              value={interest}
                              checked={selectedInterests.includes(interest)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedInterests([...selectedInterests, interest]);
                                } else {
                                  setSelectedInterests(selectedInterests.filter(i => i !== interest));
                                }
                              }}
                              className="sr-only"
                            />
                            <div className="flex items-center w-full">
                              <div className={`w-5 h-5 rounded border-2 mr-2 flex items-center justify-center ${
                                selectedInterests.includes(interest)
                                  ? "border-sunrise-500 bg-sunrise-500"
                                  : "border-gray-300 bg-white"
                              }`}>
                                {selectedInterests.includes(interest) && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm font-medium text-charcoal-900">{interest}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <input 
                        type="hidden" 
                        name="interests" 
                        value={JSON.stringify(selectedInterests)} 
                      />
                      {selectedInterests.length > 0 && (
                        <p className="text-xs text-sunrise-600 mt-2">
                          {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  {currentStep === 2 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="btn-secondary"
                    >
                      Back
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn-primary ml-auto ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {currentStep === 1 ? "Creating account..." : "Saving..."}
                      </div>
                    ) : (
                      currentStep === 1 ? "Continue" : "Complete Registration"
                    )}
                  </button>
                </div>
              </Form>

              <div className="mt-8 text-center">
                <p className="text-body text-charcoal-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-sunrise-600 hover:text-sunrise-700 font-semibold transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
