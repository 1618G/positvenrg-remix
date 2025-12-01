import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { createUser, createUserSession, verifyUserSession, getUserById } from "~/lib/auth.server";
import { generateVerificationCode } from "~/lib/email.server";
import { saveOnboardingData } from "~/lib/onboarding.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import { LegalDisclaimer } from "~/components/LegalDisclaimer";
import type { OnboardingData } from "~/lib/types.server";
import { authLogger } from "~/lib/logger.server";
import logger from "~/lib/logger.server";
import { EMAIL_CONFIG } from "~/lib/config.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const step = formData.get("step") as string;

    if (!step) {
      logger.error({ formDataKeys: Array.from(formData.keys()) }, 'Missing step parameter in register action');
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

      // Registration step 1: Validating inputs

      if (!email || !password) {
        logger.warn({ step: 1 }, 'Missing email or password in registration step 1');
        return json(
          { error: "Email and password are required", step: 1 },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        logger.warn({ step: 1, passwordLength: password.length }, 'Password too short in registration step 1');
        return json(
          { error: "Password must be at least 6 characters", step: 1 },
          { status: 400 }
        );
      }

      try {
        const user = await createUser(email, password, name || undefined);
        authLogger.userCreated(user.id, user.email, user.role);
        
        // Store user ID in session/cookie for step 2
        const token = require("~/lib/auth.server").createUserSession(user.id);
        
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
        logger.error({ error: error instanceof Error ? error.message : 'Unknown error', email, step: 1 }, 'Error creating user in registration step 1');
        
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
      
      await db.user.update({
        where: { id: user.id },
        data: {
          location: location || null,
          ageRange: ageRange || null,
          interests: parsedInterests,
        },
      });

      return json({ 
        success: true, 
        step: 3
      });
      } catch (error: any) {
        logger.error({ error: error instanceof Error ? error.message : 'Unknown error', step: 2, userId: session.userId }, 'Error in registration step 2');
        return json(
          { error: error.message || "An error occurred. Please try again.", step: 2 },
          { status: 500 }
        );
      }
    }

    // Step 3: Communication Preferences
    if (step === "3") {
      const cookieHeader = request.headers.get("Cookie");
      const token = cookieHeader
        ?.split(";")
        .find(c => c.trim().startsWith("temp_signup_token="))
        ?.split("=")[1];
      
      if (!token) {
        return json({ error: "Session expired. Please start over.", step: 1 }, { status: 400 });
      }

      const { verifyUserSession, getUserById } = require("~/lib/auth.server");
      const session = verifyUserSession(token);
      if (!session) {
        return json({ error: "Invalid session. Please start over.", step: 1 }, { status: 400 });
      }

      const communicationStyle = formData.get("communicationStyle") as string;
      const responseLength = formData.get("responseLength") as string;
      const formality = formData.get("formality") as string;

      if (!communicationStyle || !responseLength || !formality) {
        return json({ error: "Please complete all communication preferences", step: 3 }, { status: 400 });
      }

      // Store in temporary onboarding data field
      const { db } = require("~/lib/db.server");
      const user = await getUserById(session.userId);
      const existingData = ((user?.onboardingData as unknown) as OnboardingData | null) || {};
      
      await db.user.update({
        where: { id: session.userId },
        data: {
          onboardingData: {
            ...existingData,
            communicationStyle,
            responseLength,
            formality,
          }
        }
      });

      return json({ success: true, step: 4 });
    }

    // Step 4: Needs
    if (step === "4") {
      const cookieHeader = request.headers.get("Cookie");
      const token = cookieHeader
        ?.split(";")
        .find(c => c.trim().startsWith("temp_signup_token="))
        ?.split("=")[1];
      
      if (!token) {
        return json({ error: "Session expired. Please start over.", step: 1 }, { status: 400 });
      }

      const { verifyUserSession, getUserById } = require("~/lib/auth.server");
      const session = verifyUserSession(token);
      if (!session) {
        return json({ error: "Invalid session. Please start over.", step: 1 }, { status: 400 });
      }

      const primaryNeeds = JSON.parse(formData.get("primaryNeeds") as string || "[]");
      if (!primaryNeeds || primaryNeeds.length === 0) {
        return json({ error: "Please select at least one need", step: 4 }, { status: 400 });
      }

      // Store in temporary onboarding data
      const { db } = require("~/lib/db.server");
      const user = await getUserById(session.userId);
      const existingData = ((user?.onboardingData as unknown) as OnboardingData | null) || {};
      
      await db.user.update({
        where: { id: session.userId },
        data: {
          onboardingData: {
            ...existingData,
            primaryNeeds,
          }
        }
      });

      return json({ success: true, step: 5 });
    }

    // Step 5: Goals
    if (step === "5") {
      const cookieHeader = request.headers.get("Cookie");
      const token = cookieHeader
        ?.split(";")
        .find(c => c.trim().startsWith("temp_signup_token="))
        ?.split("=")[1];
      
      if (!token) {
        return json({ error: "Session expired. Please start over.", step: 1 }, { status: 400 });
      }

      const { verifyUserSession, getUserById } = require("~/lib/auth.server");
      const session = verifyUserSession(token);
      if (!session) {
        return json({ error: "Invalid session. Please start over.", step: 1 }, { status: 400 });
      }

      const goals = (formData.get("goals") as string)?.trim() || "";
      if (!goals || goals.length < 10) {
        return json({ error: "Please describe your goals (at least 10 characters)", step: 5 }, { status: 400 });
      }

      const challenges = (formData.get("challenges") as string)?.trim() || undefined;
      const dailyRoutine = (formData.get("dailyRoutine") as string)?.trim() || undefined;

      // Store in temporary onboarding data
      const { db } = require("~/lib/db.server");
      const user = await getUserById(session.userId);
      const existingData = ((user?.onboardingData as unknown) as OnboardingData | null) || {};
      
      await db.user.update({
        where: { id: session.userId },
        data: {
          onboardingData: {
            ...existingData,
            goals,
            challenges,
            dailyRoutine,
          }
        }
      });

      return json({ success: true, step: 6 });
    }

    // Step 6: Triggers & Sensitivities
    if (step === "6") {
      const cookieHeader = request.headers.get("Cookie");
      const token = cookieHeader
        ?.split(";")
        .find(c => c.trim().startsWith("temp_signup_token="))
        ?.split("=")[1];
      
      if (!token) {
        return json({ error: "Session expired. Please start over.", step: 1 }, { status: 400 });
      }

      const { verifyUserSession, getUserById } = require("~/lib/auth.server");
      const session = verifyUserSession(token);
      if (!session) {
        return json({ error: "Invalid session. Please start over.", step: 1 }, { status: 400 });
      }

      const parseJsonField = (value: string | null, defaultValue: any = []) => {
        if (!value) return defaultValue;
        try {
          return JSON.parse(value);
        } catch {
          return defaultValue;
        }
      };

      const triggers = parseJsonField(formData.get("triggers") as string | null, []);
      const sensitivities = (formData.get("sensitivities") as string)?.trim() || undefined;

      // Store in temporary onboarding data
      const { db } = require("~/lib/db.server");
      const user = await getUserById(session.userId);
      const existingData = ((user?.onboardingData as unknown) as OnboardingData | null) || {};
      
      await db.user.update({
        where: { id: session.userId },
        data: {
          onboardingData: {
            ...existingData,
            triggers,
            sensitivities,
          }
        }
      });

      return json({ success: true, step: 7 });
    }

    // Step 7: Companion Preferences & Save Onboarding Data
    if (step === "7") {
      const cookieHeader = request.headers.get("Cookie");
      const token = cookieHeader
        ?.split(";")
        .find(c => c.trim().startsWith("temp_signup_token="))
        ?.split("=")[1];
      
      if (!token) {
        return json({ error: "Session expired. Please start over.", step: 1 }, { status: 400 });
      }

      const { verifyUserSession, getUserById } = require("~/lib/auth.server");
      const session = verifyUserSession(token);
      if (!session) {
        return json({ error: "Invalid session. Please start over.", step: 1 }, { status: 400 });
      }

      // Get existing onboarding data from database (collected in previous steps)
      const user = await getUserById(session.userId);
      if (!user) {
        return json({ error: "User not found", step: 1 }, { status: 400 });
      }
      
      const existingData = ((user?.onboardingData as unknown) as OnboardingData | null) || {};

      const parseJsonField = (value: string | null, defaultValue: any = []) => {
        if (!value) return defaultValue;
        try {
          return JSON.parse(value);
        } catch {
          return defaultValue;
        }
      };

      // Add companion preferences to existing data
      const preferredCompanions = parseJsonField(formData.get("preferredCompanions") as string | null, []);

      const onboardingData = {
        ...existingData,
        preferredCompanions,
        sharePersonalInfo: formData.get("sharePersonalInfo") === "true",
        reminderPreferences: formData.get("reminderPreferences") 
          ? parseJsonField(formData.get("reminderPreferences") as string | null, undefined)
          : undefined,
      };

      // Validate required fields
      if (!onboardingData.communicationStyle || !onboardingData.responseLength || !onboardingData.formality) {
        return json({ error: "Please complete all required fields", step: 3 }, { status: 400 });
      }

      if (!onboardingData.primaryNeeds || onboardingData.primaryNeeds.length === 0) {
        return json({ error: "Please select at least one need", step: 4 }, { status: 400 });
      }

      if (!onboardingData.goals || onboardingData.goals.trim().length < 10) {
        return json({ error: "Please describe your goals (at least 10 characters)", step: 5 }, { status: 400 });
      }

      // Save onboarding data (validates and marks onboarding as complete)
      await saveOnboardingData(session.userId, onboardingData as OnboardingData);

      // Generate verification code
      const verificationCode = generateVerificationCode();
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + EMAIL_CONFIG.verification.tokenExpiryHours);

      const { db } = require("~/lib/db.server");
      
      await db.user.update({
        where: { id: session.userId },
        data: {
          verificationToken: verificationCode,
          verificationTokenExpiry: expiry,
        },
      });

      logger.info({ userId: user.id, email: user.email, step: 7 }, 'Verification code generated in registration step 7');

      return json({ 
        success: true, 
        step: 8,
        email: user.email,
        verificationCode
      });
    }

    // Step 8: Verify code and complete registration
    if (step === "8") {
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
          { error: "Please enter the 6-digit code", step: 8, email: user.email, verificationCode: user.verificationToken },
          { status: 400 }
        );
      }

      // Check if code matches
      if (user.verificationToken !== enteredCode) {
        return json(
          { error: "Invalid verification code. Please try again.", step: 8, email: user.email, verificationCode: user.verificationToken },
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

      // Onboarding is already completed from step 7, so redirect directly to dashboard
      const sessionToken = createUserSession(user.id);
      
      return redirect("/dashboard", {
        headers: {
          "Set-Cookie": `token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
        },
      });
    }

    return json({ error: "Invalid step", step: 1 }, { status: 400 });
  } catch (error: any) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Unexpected error in register action');
    return json(
      { error: error.message || "An unexpected error occurred. Please try again.", step: 1 },
      { status: 500 }
    );
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  // If user is on step 8 (verification), try to fetch their code from DB
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
          email: user.email,
          step: 8 // Ensure we're on step 8 if code exists
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
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedCompanions, setSelectedCompanions] = useState<string[]>([]);
  
  // Use verification code from actionData if available, otherwise from loaderData
  const verificationCode = actionData?.verificationCode || loaderData?.verificationCode;
  const email = actionData?.email || loaderData?.email;
  
  // If we have a code but not on step 8, go to step 8
  useEffect(() => {
    if (verificationCode && currentStep !== 8) {
      setCurrentStep(8);
    }
  }, [verificationCode, currentStep]);

  // Also check if loaderData has step 8 and we should navigate there
  useEffect(() => {
    if (loaderData?.step === 8 && currentStep !== 8) {
      setCurrentStep(8);
    }
  }, [loaderData?.step, currentStep]);

  const totalSteps = 8;

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

  // Get companions from database (fallback to hardcoded if not available)
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

  // Update step when actionData changes
  useEffect(() => {
    if (actionData?.step && actionData.step !== currentStep) {
      setCurrentStep(actionData.step);
    }
  }, [actionData?.step, currentStep]);

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Disclaimer Banner */}
      <div className="bg-white border-b border-yellow-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <LegalDisclaimer variant="inline" />
        </div>
      </div>

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

      {/* Registration Form */}
      <section className="py-16 bg-white">
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${currentStep === 8 ? "max-w-md" : currentStep === 1 || currentStep === 2 ? "max-w-md" : "max-w-3xl"}`}>
          {/* Step 8: Verification Code */}
          {currentStep === 8 ? (
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
              {verificationCode ? (
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
              ) : (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-6 text-center">
                  <p className="text-sm font-medium text-charcoal-700 mb-2">
                    Generating verification code...
                  </p>
                  <div className="w-8 h-8 border-2 border-sunrise-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-charcoal-600 mt-2">
                    Please wait while we generate your code
                  </p>
                </div>
              )}

              <Form method="post" className="space-y-6">
                <input type="hidden" name="step" value="8" />

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
                  {currentStep === 1 ? "Create Your Account" : 
                   currentStep === 2 ? "Tell Us About Yourself" :
                   ""}
                </h2>
                <p className="text-body text-charcoal-600">
                  {currentStep === 1 
                    ? "Get started with your AI companions in just a few steps"
                    : currentStep === 2
                    ? "Help us personalize your experience"
                    : ""}
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

                {/* Step 3: Communication Preferences */}
                {currentStep === 3 && (
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
                        <select name="responseLength" className="input" required defaultValue="moderate">
                          <option value="brief">Brief (Quick responses)</option>
                          <option value="moderate">Moderate (Balanced detail)</option>
                          <option value="detailed">Detailed (Comprehensive responses)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-charcoal-700 mb-2">
                          Formality Level
                        </label>
                        <select name="formality" className="input" required defaultValue="casual">
                          <option value="casual">Casual (Friendly and relaxed)</option>
                          <option value="professional">Professional (Respectful and formal)</option>
                          <option value="friendly">Friendly (Warm but balanced)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Needs */}
                {currentStep === 4 && (
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

                {/* Step 5: Goals & Challenges */}
                {currentStep === 5 && (
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

                {/* Step 6: Triggers & Sensitivities */}
                {currentStep === 6 && (
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

                {/* Step 7: Companion Preferences */}
                {currentStep === 7 && (
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
                        Once you complete this step, we'll verify your email and you'll be ready to start your journey with personalized AI companions.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  {currentStep > 1 && currentStep !== 8 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                      className="btn-secondary"
                    >
                      Back
                    </button>
                  )}
                  
                  {currentStep < totalSteps ? (
                    <button
                      type="submit"
                      disabled={isSubmitting || (currentStep === 4 && selectedNeeds.length === 0)}
                      className={`btn-primary ml-auto ${isSubmitting || (currentStep === 4 && selectedNeeds.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={(e) => {
                        // Validate step 4 before proceeding
                        if (currentStep === 4 && selectedNeeds.length === 0) {
                          e.preventDefault();
                          alert("Please select at least one need");
                          return false;
                        }
                      }}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        "Next Step"
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`btn-primary ml-auto ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Verifying...
                        </div>
                      ) : (
                        "Verify & Complete Registration"
                      )}
                    </button>
                  )}
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
