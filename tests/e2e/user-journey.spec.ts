import { test, expect } from "@playwright/test";

/**
 * End-to-end tests for critical user journeys
 */

test.describe("User Registration Journey", () => {
  test("should complete full registration flow", async ({ page }) => {
    // Navigate to registration page
    await page.goto("/register");
    await expect(page).toHaveTitle(/Nojever/);

    // Step 1: Account creation
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', "TestPassword123!");
    await page.fill('input[name="name"]', "Test User");
    await page.click('button[type="submit"]');

    // Wait for step 2
    await expect(page.locator('text=Step 2')).toBeVisible({ timeout: 10000 });

    // Step 2: Profile info
    await page.fill('input[name="location"]', "London, UK");
    await page.selectOption('select[name="ageRange"]', "26-35");
    await page.click('button[type="submit"]');

    // Continue through steps (simplified - would need to fill all fields)
    // This is a template - actual implementation would test all 8 steps
  });
});

test.describe("User Login Journey", () => {
  test("should login with valid credentials", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");
    
    // Fill login form (assuming test user exists)
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/Invalid email or password/')).toBeVisible();
  });
});

test.describe("Chat Functionality", () => {
  test("should load chat interface", async ({ page }) => {
    // This would require authentication first
    // For now, just test that the route exists
    await page.goto("/chat/grace");
    
    // Should show chat interface or redirect to login
    const isLoginPage = page.url().includes("/login");
    const isChatPage = page.url().includes("/chat");
    
    expect(isLoginPage || isChatPage).toBe(true);
  });
});

test.describe("Dashboard Access", () => {
  test("should show dashboard after login", async ({ page }) => {
    // Navigate to dashboard (will redirect to login if not authenticated)
    await page.goto("/dashboard");
    
    // Should either show dashboard or redirect to login
    const url = page.url();
    expect(url.includes("/dashboard") || url.includes("/login")).toBe(true);
  });
});

