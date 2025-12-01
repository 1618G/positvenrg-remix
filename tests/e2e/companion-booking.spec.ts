import { test, expect } from "@playwright/test";

test.describe("Companion Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto("/");
  });

  test("should complete full booking flow", async ({ page }) => {
    // Step 1: Register/Login
    await page.click("text=Login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "TestPassword123");
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard");

    // Step 2: Navigate to human companions
    await page.click("text=Companions");
    await page.click("text=Human Companions");

    // Wait for companions list
    await page.waitForSelector("text=Book Now");

    // Step 3: Click on a companion
    const firstCompanion = page.locator(".card").first();
    await firstCompanion.click();

    // Step 4: Start booking
    await page.click("text=Book Appointment");

    // Step 5: Fill booking form
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split("T")[0];

    await page.fill('input[name="date"]', dateString);
    await page.fill('input[name="time"]', "10:00");
    await page.fill('input[name="duration"]', "60");

    await page.click('button[type="submit"]');

    // Step 6: Select meeting type
    await page.waitForSelector('select[name="meetingType"]');
    await page.selectOption('select[name="meetingType"]', "VIDEO_CALL");
    await page.fill('textarea[name="notes"]', "Looking forward to our conversation!");

    await page.click('button[type="submit"]');

    // Step 7: Verify appointment created
    await page.waitForSelector("text=Appointment Created");
    expect(await page.textContent("body")).toContain("Appointment");
  });

  test("should display companion profile correctly", async ({ page }) => {
    await page.goto("/companions/human");

    // Wait for companions to load
    await page.waitForSelector(".card");

    // Check that companion cards have required information
    const companionCard = page.locator(".card").first();
    await expect(companionCard).toContainText("£");
    await expect(companionCard).toContainText("hour");
    await expect(companionCard).toContainText("Book Now");
  });

  test("should show disclaimer on booking page", async ({ page }) => {
    await page.goto("/companions/human");
    await page.waitForSelector(".card");
    await page.click(".card >> text=Book Now");

    // Check for disclaimer
    const disclaimer = page.locator("text=not a substitute for professional");
    await expect(disclaimer).toBeVisible();
  });
});


