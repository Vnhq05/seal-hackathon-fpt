import { test, expect } from "@playwright/test";

const SAMPLE_EVENT_ID = "00000000-0000-0000-0000-000000000001";

test.describe("middleware public paths", () => {
  test("includes live-score and hackathons prefixes", async ({ page }) => {
    for (const path of [`/live-score/${SAMPLE_EVENT_ID}`, `/hackathons/${SAMPLE_EVENT_ID}/register`]) {
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/login/);
    }
  });
});
