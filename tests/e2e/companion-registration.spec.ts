import { test, expect } from "@playwright/test";

test.describe("Companion Registration Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Register and login first
    await page.goto("/register");
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', "TestPassword123");
    await page.fill('input[name="name"]', "Test User");
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL("**/dashboard");
  });

  test("should complete companion registration", async ({ page }) => {
    // Navigate to become companion page
    await page.goto("/become-companion");

    // Fill registration form
    await page.fill('input[name="displayName"]', "Friendly Companion");
    await page.fill('textarea[name="bio"]', "I'm here to help and support!");
    await page.fill('input[name="pricePerHour"]', "5000");
    await page.selectOption('select[name="timezone"]', "Europe/London");

    // Submit form
    await page.click('button[type="submit"]');

    // Should proceed to calendar connection step
    await page.waitForSelector("text=Connect Google Calendar");

    // Skip calendar for now
    await page.click('button:has-text("Skip for Now")');

    // Should show success message
    await expect(page.locator("text=Profile Created")).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/become-companion");

    // Try to submit without required fields
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator("text=required")).toBeVisible();
  });

  test("should validate price range", async ({ page }) => {
    await page.goto("/become-companion");

    // Try with price below minimum
    await page.fill('input[name="displayName"]', "Test");
    await page.fill('input[name="pricePerHour"]', "50"); // Below minimum of 100
    await page.selectOption('select[name="timezone"]', "Europe/London");

    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator("text=error")).toBeVisible();
  });
});


