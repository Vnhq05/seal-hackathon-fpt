import { test, expect } from "@playwright/test";

const SAMPLE_EVENT_ID = "00000000-0000-0000-0000-000000000001";

test.describe("public routes", () => {
  test("live-score page is accessible without login", async ({ page }) => {
    const response = await page.goto(`/live-score/${SAMPLE_EVENT_ID}`);
    expect(response?.status()).toBeLessThan(500);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("hackathon registration page is accessible without login", async ({ page }) => {
    const response = await page.goto(`/hackathons/${SAMPLE_EVENT_ID}/register`);
    expect(response?.status()).toBeLessThan(500);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("protected coordinator route redirects to login", async ({ page }) => {
    await page.goto("/coordinator/participants");
    await expect(page).toHaveURL(/\/login/);
  });
});
