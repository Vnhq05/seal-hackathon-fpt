import { test, expect, type Page } from "@playwright/test";

const TEAM_LEADER = {
  email: "student4@fpt.edu.vn",
  password: "12345678",
};

const NO_TEAM_STUDENT = {
  email: "student6@fpt.edu.vn",
  password: "12345678",
};

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

test.describe("Finding Members API integration", () => {
  test("team leader sees matching candidates and can open public profile modal", async ({ page }) => {
    const candidateStatuses: number[] = [];
    page.on("response", (response) => {
      const url = response.url();
      if (
        url.includes("/matching/candidates") &&
        !url.includes("/profile") &&
        response.request().method() === "GET"
      ) {
        candidateStatuses.push(response.status());
      }
    });

    await login(page, TEAM_LEADER.email, TEAM_LEADER.password);

    const candidatesRequest = page.waitForResponse(
      (response) =>
        response.url().includes("/matching/candidates") &&
        !response.url().includes("/profile") &&
        response.request().method() === "GET",
    );
    await page.goto("/student/teams");
    const candidatesResponse = await candidatesRequest;
    expect(candidatesResponse.status()).toBe(200);

    await expect(page.getByText("Finding members")).toBeVisible({ timeout: 15_000 });

    const inviteButton = page.getByRole("button", { name: "Invite" }).first();
    if (await inviteButton.isVisible()) {
      await expect(inviteButton).toBeEnabled();
    }

    const publicProfileName = page.locator('button[title="View public profile and achievements"]');
    if (await publicProfileName.count()) {
      const profileRequest = page.waitForResponse(
        (response) =>
          response.url().includes("/matching/candidates/") &&
          response.url().includes("/profile") &&
          response.request().method() === "GET",
      );
      await publicProfileName.first().click();
      const profileResponse = await profileRequest;
      expect(profileResponse.status()).toBe(200);
      await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
      await page.getByRole("button", { name: "Close" }).click();
    }

    expect(candidateStatuses.some((status) => status === 200)).toBeTruthy();
  });

  test("participant can update matching profile", async ({ page }) => {
    await login(page, NO_TEAM_STUDENT.email, NO_TEAM_STUDENT.password);
    await page.goto("/student/teams");

    await expect(page.getByText("Your matching profile")).toBeVisible({ timeout: 15_000 });

    const lookingCheckbox = page.getByRole("checkbox", { name: /looking for a team/i });
    await lookingCheckbox.check();
    await page.getByRole("checkbox", { name: /publish profile/i }).check();

    const saveRequest = page.waitForResponse(
      (response) =>
        response.url().includes("/enrollments/my/matching-profile") &&
        response.request().method() === "PUT",
    );
    await page.getByRole("button", { name: /save profile/i }).click();
    const saveResponse = await saveRequest;
    expect(saveResponse.status()).toBe(200);
    await expect(page.getByText("Saved")).toBeVisible();
  });
});
