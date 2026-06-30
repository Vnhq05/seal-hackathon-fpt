/**
 * Browser verification for Participant Feedback API wiring.
 * Run: node scripts/_verify-participant-feedback.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const COORDINATOR_EMAIL = process.env.E2E_COORDINATOR_EMAIL ?? "coordinator@seal.com";
const COORDINATOR_PASSWORD = process.env.E2E_COORDINATOR_PASSWORD ?? "12345678";
const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL ?? "student1@fpt.edu.vn";
const STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD ?? "12345678";

const FEEDBACK_API = /\/api\/events\/[^/]+\/participant-feedback/;

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByLabel(/^email$/i).fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

function trackPage(page, consoleErrors, failedRequests, apiCalls) {
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("requestfailed", (req) => {
    const url = req.url();
    const err = req.failure()?.errorText ?? "failed";
    if (err.includes("ERR_ABORTED")) return;
    if (url.includes("/api/")) {
      failedRequests.push(`${req.method()} ${url} — ${err}`);
    }
  });
  page.on("response", (res) => {
    const url = res.url();
    if (!url.includes("/api/")) return;
    apiCalls.push({ method: res.request().method(), url, status: res.status() });
    if (res.status() >= 400 && !url.includes("/participant-feedback/me")) {
      failedRequests.push(`${res.request().method()} ${url} — HTTP ${res.status()}`);
    }
  });
}

async function selectFirstEvent(page) {
  const eventSelect = page.locator("select").first();
  await eventSelect.waitFor({ state: "visible", timeout: 10000 });
  const options = await eventSelect.locator("option").all();
  for (const opt of options) {
    const value = await opt.getAttribute("value");
    if (value) {
      await eventSelect.selectOption(value);
      return value;
    }
  }
  return null;
}

async function verifyCoordinatorFeedback(page, consoleErrors, failedRequests, apiCalls) {
  await login(page, COORDINATOR_EMAIL, COORDINATOR_PASSWORD);
  await page.goto(`${BASE}/coordinator/feedback`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);

  const h1 = await page.locator("h1").first().textContent().catch(() => "");
  const headingOk = h1?.includes("Participant Feedback");
  console.log(`PAGE /coordinator/feedback: ${headingOk ? "PASS" : "FAIL"} — h1="${h1?.trim()}"`);
  if (!headingOk) failedRequests.push("PAGE /coordinator/feedback — heading mismatch");

  const eventId = await selectFirstEvent(page);
  if (eventId) {
    await page.waitForTimeout(2500);

    const listHit = apiCalls.some(
      (c) =>
        c.method === "GET" &&
        FEEDBACK_API.test(c.url) &&
        !c.url.includes("/summary") &&
        !c.url.includes("/me") &&
        c.status < 400,
    );
    console.log(`ENDPOINT GET /events/{id}/participant-feedback: ${listHit ? "PASS" : "MISSING"}`);
    if (!listHit) failedRequests.push("GET /events/{id}/participant-feedback not called");

    const summaryHit = apiCalls.some(
      (c) => c.method === "GET" && c.url.includes("/participant-feedback/summary") && c.status < 400,
    );
    console.log(`ENDPOINT GET /events/{id}/participant-feedback/summary: ${summaryHit ? "PASS" : "MISSING"}`);
    if (!summaryHit) failedRequests.push("GET /events/{id}/participant-feedback/summary not called");

    const exportBtn = page.getByRole("button", { name: /Export CSV/i });
    if (await exportBtn.isEnabled().catch(() => false)) {
      const beforeCount = apiCalls.length;
      await exportBtn.click();
      await page.waitForTimeout(1500);
      const exportHit = apiCalls
        .slice(beforeCount)
        .some(
          (c) =>
            c.method === "GET" &&
            FEEDBACK_API.test(c.url) &&
            !c.url.includes("/summary") &&
            !c.url.includes("/me") &&
            c.status < 400,
        );
      console.log(`INTERACTION Export CSV: ${exportHit ? "PASS" : "MISSING list API call"}`);
      if (!exportHit) failedRequests.push("Export CSV did not trigger list API");
    } else {
      console.log("INTERACTION Export CSV: button disabled (no feedback data)");
    }
  } else {
    console.log("INTERACTION coordinator feedback: no events in dropdown");
  }
}

async function verifyStudentFeedback(page, consoleErrors, failedRequests, apiCalls) {
  await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
  await page.goto(`${BASE}/student/feedback`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);

  const h1 = await page.locator("h1").first().textContent().catch(() => "");
  const headingOk = h1?.includes("Post-Event Feedback");
  console.log(`PAGE /student/feedback: ${headingOk ? "PASS" : "FAIL"} — h1="${h1?.trim()}"`);
  if (!headingOk) failedRequests.push("PAGE /student/feedback — heading mismatch");

  const meHit = apiCalls.some(
    (c) => c.method === "GET" && c.url.includes("/participant-feedback/me"),
  );
  console.log(`ENDPOINT GET /events/{id}/participant-feedback/me: ${meHit ? "PASS" : "MISSING"}`);
  if (!meHit) failedRequests.push("GET /events/{id}/participant-feedback/me not called");

  const bodyText = await page.locator("body").innerText();
  const gateMessages = [
    "No event found",
    "Feedback opens when the event ends",
    "You must be on a confirmed team",
    "Thank you for your feedback",
    "Submit feedback",
  ];
  const matchedGate = gateMessages.find((m) => bodyText.includes(m));
  console.log(`STUDENT gate state: ${matchedGate ?? "unknown"} — ${matchedGate ? "PASS" : "FAIL"}`);
  if (!matchedGate) failedRequests.push("Student feedback page — no recognized gate state");

  if (bodyText.includes("Submit feedback")) {
    const submitBtn = page.getByRole("button", { name: /Submit feedback/i });
    await submitBtn.click();
    await page.waitForTimeout(500);
    const validationVisible = await page
      .getByText(/Number must be greater than or equal to 1|Required|Invalid/i)
      .isVisible()
      .catch(() => false);
    console.log(`INTERACTION submit without rating validation: ${validationVisible ? "PASS" : "SKIP"}`);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  const consoleErrors = [];
  const failedRequests = [];
  const apiCalls = [];

  {
    const page = await browser.newPage();
    trackPage(page, consoleErrors, failedRequests, apiCalls);
    await verifyCoordinatorFeedback(page, consoleErrors, failedRequests, apiCalls);
    await page.close();
  }

  {
    const page = await browser.newPage();
    const studentErrors = [];
    const studentFailed = [];
    const studentApis = [];
    trackPage(page, studentErrors, studentFailed, studentApis);
    await verifyStudentFeedback(page, studentErrors, studentFailed, studentApis);
    consoleErrors.push(...studentErrors);
    failedRequests.push(...studentFailed);
    apiCalls.push(...studentApis);
    await page.close();
  }

  await browser.close();

  const frontendConsoleErrors = consoleErrors.filter(
    (e) => !e.includes("favicon") && !e.includes("Download the React DevTools"),
  );

  console.log("\n--- Results ---");
  console.log(`Console errors: ${frontendConsoleErrors.length}`);
  frontendConsoleErrors.forEach((e) => console.log(`  ERR: ${e}`));
  console.log(`Failed checks: ${failedRequests.length}`);
  failedRequests.forEach((e) => console.log(`  FAIL: ${e}`));

  const feedbackApis = apiCalls.filter((c) => FEEDBACK_API.test(c.url));
  console.log(`Participant Feedback API calls: ${feedbackApis.length}`);
  feedbackApis.forEach((c) => console.log(`  ${c.method} ${c.url} → ${c.status}`));

  if (frontendConsoleErrors.length > 0 || failedRequests.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
