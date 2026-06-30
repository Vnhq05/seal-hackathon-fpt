/**
 * Browser verification for Result Publication Flow APIs.
 * Run: node scripts/_verify-result-publication.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const COORDINATOR_EMAIL = process.env.E2E_COORDINATOR_EMAIL ?? "coordinator@seal.com";
const COORDINATOR_PASSWORD = process.env.E2E_COORDINATOR_PASSWORD ?? "12345678";
const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL ?? "student1@fpt.edu.vn";
const STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD ?? "12345678";

const COORDINATOR_APIS = [
  { name: "GET /events/{id}/leaderboard", pattern: /\/api\/events\/[^/]+\/leaderboard(?:\?|$)/, method: "GET" },
  { name: "GET /events/{id}/finalists", pattern: /\/api\/events\/[^/]+\/finalists(?:\?|$)/, method: "GET" },
  {
    name: "GET /events/{id}/finalists/contested",
    pattern: /\/api\/events\/[^/]+\/finalists\/contested/,
    method: "GET",
  },
  { name: "GET /events/{id}/awards", pattern: /\/api\/events\/[^/]+\/awards(?:\?|$)/, method: "GET" },
];

const STUDENT_APIS = [
  { name: "GET /public/events/{id}/awards", pattern: /\/api\/public\/events\/[^/]+\/awards/, method: "GET" },
  {
    name: "GET /public/events/{id}/awards/participation",
    pattern: /\/api\/public\/events\/[^/]+\/awards\/participation/,
    method: "GET",
  },
  {
    name: "GET /events/{id}/awards/participation/me",
    pattern: /\/api\/events\/[^/]+\/awards\/participation\/me/,
    method: "GET",
    allow404: true,
  },
];

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
    if (res.status() >= 400) {
      if (
        url.includes("/teams/my-team") ||
        url.includes("/awards/participation/me") ||
        url.includes("/tracks/draw-session")
      ) {
        return;
      }
      failedRequests.push(`${res.request().method()} ${url} — HTTP ${res.status()}`);
    }
  });
}

function checkEndpoints(apiCalls, failedRequests, label, endpoints) {
  for (const ep of endpoints) {
    const hit = apiCalls.some(
      (c) =>
        c.method === ep.method &&
        ep.pattern.test(c.url) &&
        (c.status < 400 || (ep.allow404 && c.status === 404)),
    );
    console.log(`${label} ${ep.name}: ${hit ? "PASS" : "MISSING"}`);
    if (!hit) failedRequests.push(`${label} — ${ep.name} not called successfully`);
  }
}

function extractEventId(apiCalls) {
  for (const c of apiCalls) {
    const m = c.url.match(/\/api\/(?:public\/)?events\/([0-9a-f-]{36})/i);
    if (m) return m[1];
  }
  return null;
}

async function verifyCoordinatorTracks(page, failedRequests, apiCalls) {
  await login(page, COORDINATOR_EMAIL, COORDINATOR_PASSWORD);
  await page.goto(`${BASE}/coordinator/tracks`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);

  const h1 = await page.locator("h1").first().textContent().catch(() => "");
  const headingOk = h1?.includes("Track & Finals Management");
  console.log(`PAGE /coordinator/tracks: ${headingOk ? "PASS" : "FAIL"} — h1="${h1?.trim()}"`);
  if (!headingOk) failedRequests.push("PAGE /coordinator/tracks — heading mismatch");

  const eventSelect = page.locator("select").first();
  if (await eventSelect.isVisible().catch(() => false)) {
    const options = await eventSelect.locator("option").all();
    for (const opt of options) {
      const value = await opt.getAttribute("value");
      if (value) {
        await eventSelect.selectOption(value);
        await page.waitForTimeout(2500);
        console.log(`INTERACTION coordinator tracks: selected event ${value}`);
        break;
      }
    }
  }

  checkEndpoints(
    apiCalls,
    failedRequests,
    "COORDINATOR_TRACKS",
    COORDINATOR_APIS.filter((ep) => ep.name.includes("finalists")),
  );
}

async function verifyCoordinatorLivescore(page, failedRequests, apiCalls, eventId) {
  await login(page, COORDINATOR_EMAIL, COORDINATOR_PASSWORD);
  if (!eventId) {
    await page.goto(`${BASE}/coordinator/livescore`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    const eventLink = page.locator('a[href*="/coordinator/livescore/"]').first();
    if (await eventLink.isVisible().catch(() => false)) {
      const href = await eventLink.getAttribute("href");
      const match = href?.match(/\/livescore\/([0-9a-f-]{36})/i);
      eventId = match?.[1] ?? null;
    }
  }

  if (!eventId) {
    console.log("INTERACTION coordinator livescore: no event id available");
    failedRequests.push("No event id for coordinator livescore arena");
    return;
  }

  await page.goto(`${BASE}/coordinator/livescore/${eventId}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(4000);

  const url = page.url();
  console.log(`INTERACTION coordinator arena: navigated to ${url}`);
  if (!url.includes(`/coordinator/livescore/${eventId}`)) {
    failedRequests.push(`Coordinator arena URL invalid: ${url}`);
  }

  const publishFlow = page.getByText("Publish Flow");
  const publishVisible = await publishFlow.isVisible().catch(() => false);
  console.log(`INTERACTION Publish Flow panel: ${publishVisible ? "PASS" : "MISSING"}`);
  if (!publishVisible) failedRequests.push("Publish Flow panel not visible on coordinator arena");

  checkEndpoints(
    apiCalls,
    failedRequests,
    "COORDINATOR",
    COORDINATOR_APIS.filter((ep) => ep.name.includes("leaderboard")),
  );
}

async function verifyStudentResults(page, failedRequests, apiCalls) {
  await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
  await page.goto(`${BASE}/student/results`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);

  const h1 = await page.locator("h1").first().textContent().catch(() => "");
  const headingOk = h1?.includes("Results & Awards");
  console.log(`PAGE /student/results: ${headingOk ? "PASS" : "FAIL"} — h1="${h1?.trim()}"`);
  if (!headingOk) failedRequests.push("PAGE /student/results — heading mismatch");

  checkEndpoints(apiCalls, failedRequests, "STUDENT", STUDENT_APIS);

  await page.goto(`${BASE}/student/awards`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  const redirected = page.url().includes("/student/results");
  console.log(`REDIRECT /student/awards → /student/results: ${redirected ? "PASS" : "FAIL"}`);
  if (!redirected) failedRequests.push("/student/awards did not redirect to /student/results");
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const failedRequests = [];
  const apiCalls = [];
  let discoveredEventId = null;

  {
    const page = await browser.newPage();
    const studentErrors = [];
    const studentFailed = [];
    const studentApis = [];
    trackPage(page, studentErrors, studentFailed, studentApis);
    await verifyStudentResults(page, studentFailed, studentApis);
    discoveredEventId = extractEventId(studentApis);
    consoleErrors.push(...studentErrors);
    failedRequests.push(...studentFailed);
    apiCalls.push(...studentApis);
    await page.close();
  }

  {
    const page = await browser.newPage();
    trackPage(page, consoleErrors, failedRequests, apiCalls);
    await verifyCoordinatorTracks(page, failedRequests, apiCalls);
    await page.close();
  }

  {
    const page = await browser.newPage();
    trackPage(page, consoleErrors, failedRequests, apiCalls);
    await verifyCoordinatorLivescore(page, failedRequests, apiCalls, discoveredEventId);
    await page.close();
  }

  await browser.close();

  const frontendConsoleErrors = consoleErrors.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("Download the React DevTools") &&
      !e.includes("WebSocket") &&
      !e.includes("ws://") &&
      !e.includes("draw-session") &&
      !e.includes("participation/me") &&
      !/status of 404/.test(e),
  );

  console.log("\n--- Results ---");
  console.log(`Console errors: ${frontendConsoleErrors.length}`);
  frontendConsoleErrors.forEach((e) => console.log(`  ERR: ${e}`));
  console.log(`Failed checks: ${failedRequests.length}`);
  failedRequests.forEach((e) => console.log(`  FAIL: ${e}`));

  const allEndpoints = [...COORDINATOR_APIS, ...STUDENT_APIS];
  const resultApis = apiCalls.filter((c) =>
    allEndpoints.some((ep) => ep.method === c.method && ep.pattern.test(c.url)),
  );
  console.log(`Result Publication API calls: ${resultApis.length}`);
  resultApis.forEach((c) => console.log(`  ${c.method} ${c.url} → ${c.status}`));

  if (frontendConsoleErrors.length > 0 || failedRequests.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
