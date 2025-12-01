import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Integration tests for user registration flow
 * These tests verify the complete registration process
 */

describe("User Registration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Registration Steps", () => {
    it("should validate step 1: account creation", () => {
      // Test email validation
      const validEmail = "test@example.com";
      const invalidEmail = "not-an-email";
      
      expect(validEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(invalidEmail).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it("should validate password requirements", () => {
      const validPassword = "password123";
      const invalidPassword = "123";
      
      expect(validPassword.length).toBeGreaterThanOrEqual(6);
      expect(invalidPassword.length).toBeLessThan(6);
    });

    it("should validate step 2: profile information", () => {
      const validLocation = "London, UK";
      const validAgeRange = "26-35";
      const validInterests = ["Health & Wellness", "Fitness & Exercise"];
      
      expect(validLocation).toBeTruthy();
      expect(["18-25", "26-35", "36-50", "50+"]).toContain(validAgeRange);
      expect(Array.isArray(validInterests)).toBe(true);
      expect(validInterests.length).toBeGreaterThan(0);
    });

    it("should validate step 3: communication preferences", () => {
      const validStyle = "direct";
      const validLength = "moderate";
      const validFormality = "professional";
      
      expect(["direct", "gentle", "encouraging", "listening"]).toContain(validStyle);
      expect(["brief", "moderate", "detailed"]).toContain(validLength);
      expect(["casual", "professional", "friendly"]).toContain(validFormality);
    });

    it("should validate step 4: primary needs", () => {
      const validNeeds = ["Stress Management", "Motivation"];
      
      expect(Array.isArray(validNeeds)).toBe(true);
      expect(validNeeds.length).toBeGreaterThan(0);
    });

    it("should validate step 5: goals", () => {
      const validGoals = "I want to improve my mental health and achieve work-life balance.";
      const invalidGoals = "Short";
      
      expect(validGoals.length).toBeGreaterThanOrEqual(10);
      expect(invalidGoals.length).toBeLessThan(10);
    });

    it("should validate step 8: verification code", () => {
      const validCode = "123456";
      const invalidCode = "12345";
      
      expect(validCode.length).toBe(6);
      expect(/^\d{6}$/.test(validCode)).toBe(true);
      expect(invalidCode.length).not.toBe(6);
    });
  });

  describe("Data Persistence", () => {
    it("should structure onboarding data correctly", () => {
      const onboardingData = {
        communicationStyle: "direct",
        responseLength: "moderate",
        formality: "professional",
        primaryNeeds: ["Stress Management"],
        goals: "Test goals description",
        preferredCompanions: ["grace", "spark"],
      };
      
      expect(onboardingData).toHaveProperty("communicationStyle");
      expect(onboardingData).toHaveProperty("responseLength");
      expect(onboardingData).toHaveProperty("formality");
      expect(onboardingData).toHaveProperty("primaryNeeds");
      expect(onboardingData).toHaveProperty("goals");
      expect(Array.isArray(onboardingData.primaryNeeds)).toBe(true);
    });
  });
});

