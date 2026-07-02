# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: finding-members.spec.ts >> Finding Members API integration >> team leader sees matching candidates and can open public profile modal
- Location: e2e\finding-members.spec.ts:22:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - link "SEAL Hackathon SEAL Hackathon" [ref=e5] [cursor=pointer]:
          - /url: /student
          - generic [ref=e6]:
            - img "SEAL Hackathon" [ref=e7]
            - generic [ref=e8]: SEAL Hackathon
        - paragraph [ref=e9]: Student
      - generic [ref=e12]:
        - generic [ref=e14]: SV
        - generic [ref=e15]:
          - paragraph [ref=e16]: Sinh Vien 4
          - paragraph [ref=e17]: Student
      - navigation "Portal navigation" [ref=e18]:
        - link "Dashboard" [ref=e19] [cursor=pointer]:
          - /url: /student
          - img [ref=e21]
          - text: Dashboard
        - link "Teams" [ref=e26] [cursor=pointer]:
          - /url: /student/teams
          - img [ref=e28]
          - text: Teams
        - link "Competition track" [ref=e33] [cursor=pointer]:
          - /url: /student/tracks/draw
          - img [ref=e35]
          - text: Competition track
        - link "Submissions" [ref=e38] [cursor=pointer]:
          - /url: /student/submissions
          - img [ref=e40]
          - text: Submissions
        - link "Rankings" [ref=e43] [cursor=pointer]:
          - /url: /ranking
          - img [ref=e45]
          - text: Rankings
        - link "Results & Awards" [ref=e49] [cursor=pointer]:
          - /url: /student/results
          - img [ref=e51]
          - text: Results & Awards
        - link "Feedback" [ref=e53] [cursor=pointer]:
          - /url: /student/feedback
          - img [ref=e55]
          - text: Feedback
        - link "MentorHub" [ref=e57] [cursor=pointer]:
          - /url: /student/mentor-hub
          - img [ref=e59]
          - text: MentorHub
        - link "Settings" [ref=e61] [cursor=pointer]:
          - /url: /student/settings
          - img [ref=e63]
          - text: Settings
      - generic [ref=e66]:
        - link "Submit Project" [ref=e67] [cursor=pointer]:
          - /url: /student/submissions
        - generic [ref=e69]:
          - link "Support" [ref=e70] [cursor=pointer]:
            - /url: /student/support
            - img [ref=e71]
            - text: Support
          - button "Sign Out" [ref=e74] [cursor=pointer]:
            - img [ref=e75]
            - text: Sign Out
    - generic [ref=e77]:
      - banner [ref=e78]:
        - navigation "Breadcrumb" [ref=e79]:
          - generic [ref=e81]: Teams
        - generic [ref=e82]:
          - navigation [ref=e83]:
            - link "Explore" [ref=e84] [cursor=pointer]:
              - /url: /student/projects
            - link "Rankings" [ref=e85] [cursor=pointer]:
              - /url: /ranking
            - link "Results" [ref=e86] [cursor=pointer]:
              - /url: /student/results
            - link "Teams" [ref=e87] [cursor=pointer]:
              - /url: /student/teams
          - generic [ref=e88]:
            - generic [ref=e89]:
              - img [ref=e91]
              - textbox "Search teams, events..." [ref=e94]
            - generic [ref=e96]: SV
      - main [ref=e97]:
        - generic [ref=e98]:
          - generic [ref=e99]:
            - generic [ref=e100]:
              - heading "My Teams" [level=1] [ref=e101]
              - paragraph [ref=e102]: Manage your teams across hackathon events.
            - generic [ref=e103]: 1 event
          - generic [ref=e104]:
            - button "Current" [ref=e105]
            - button "Past participation" [ref=e106]
          - generic [ref=e107]:
            - generic [ref=e108]:
              - generic [ref=e109]: Events you joined
              - 'button "SEAL Fall Hackathon Demo Team: Team Beta FORMING" [ref=e111]':
                - generic [ref=e112]:
                  - img [ref=e113]
                  - generic [ref=e116]: SEAL Fall Hackathon Demo
                - generic [ref=e117]: "Team: Team Beta"
                - generic [ref=e118]: FORMING
            - generic [ref=e119]:
              - generic [ref=e120]:
                - generic [ref=e121]:
                  - img [ref=e123]
                  - generic [ref=e128]:
                    - generic [ref=e129]:
                      - generic [ref=e130]: Team Beta
                      - button [ref=e131]:
                        - img [ref=e132]
                    - generic [ref=e134]:
                      - text: "Status:"
                      - generic [ref=e135]: FORMING
                  - generic [ref=e136]: 2 / 5
                - generic [ref=e137]:
                  - generic [ref=e138]: SEAL Fall Hackathon Demo
                  - generic [ref=e139]: Fall 2026
                  - generic [ref=e140]: 2026-09-01 — 2026-11-30
                  - generic [ref=e141]: FPT University Da Nang
                  - generic [ref=e142]: OPEN
                - generic [ref=e143]: Team needs at least 3 members (including you) before choosing a track. Currently 2 members.
                - generic [ref=e144]:
                  - generic [ref=e145]: "Track:"
                  - generic [ref=e146]: AI and Data
                - generic [ref=e147]:
                  - generic [ref=e148]:
                    - generic [ref=e149]: Sinh Vien 5
                    - button "Remove" [ref=e151]
                  - generic [ref=e152]:
                    - generic [ref=e153]: Sinh Vien 4
                    - generic [ref=e155]: Leader (you)
                - generic [ref=e156]:
                  - text: Invite member
                  - generic [ref=e157]:
                    - textbox "email@example.com" [ref=e158]
                    - button "Invite" [ref=e159]
                  - generic [ref=e160]:
                    - heading "Finding members" [level=4] [ref=e161]
                    - paragraph [ref=e162]: Participants who enabled "I am looking for a team" in this event.
                    - generic [ref=e163]:
                      - textbox "Search by preferred role" [ref=e164]
                      - button "Search" [ref=e165]
                    - paragraph [ref=e166]: Loading candidates...
                - button "Transfer leadership" [ref=e168]
              - generic [ref=e169]:
                - heading "Recruitment settings" [level=3] [ref=e170]
                - paragraph [ref=e171]: Advertise open roles so solo participants can find your team.
                - generic [ref=e172] [cursor=pointer]:
                  - checkbox "Open for recruitment" [checked] [ref=e173]
                  - text: Open for recruitment
                - generic [ref=e174]:
                  - text: Recruitment note
                  - textbox "What kind of teammates are you looking for?" [ref=e175]: Looking for a backend developer to complete our team!
                - generic [ref=e176]:
                  - text: Needed roles (max 5)
                  - generic [ref=e177]:
                    - button "Frontend" [ref=e178]
                    - button "Backend" [ref=e179]
                    - button "Full-stack" [ref=e180]
                    - button "Mobile" [ref=e181]
                    - button "AI / ML" [ref=e182]
                    - button "Design" [ref=e183]
                    - button "DevOps" [ref=e184]
                    - button "Data" [ref=e185]
                    - button "Product / PM" [ref=e186]
                    - button "Other" [ref=e187]
                - button "Save recruitment" [ref=e189]
              - generic [ref=e190]:
                - generic [ref=e191]: Rounds
                - generic [ref=e193]:
                  - generic [ref=e194]:
                    - generic [ref=e195]: Round One
                    - generic [ref=e196]: 2026-10-01 08:00 — 2026-10-15 23:59
                    - generic [ref=e197]: "Round has not started yet. Opens: 2026-10-01 08:00 — 2026-10-15 23:59"
                  - button "Locked" [disabled] [ref=e199]:
                    - img [ref=e200]
                    - text: Locked
  - button "Open Next.js Dev Tools" [ref=e208] [cursor=pointer]:
    - img [ref=e209]
  - alert [ref=e212]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const TEAM_LEADER = {
  4  |   email: "student4@fpt.edu.vn",
  5  |   password: "12345678",
  6  | };
  7  | 
  8  | const NO_TEAM_STUDENT = {
  9  |   email: "student6@fpt.edu.vn",
  10 |   password: "12345678",
  11 | };
  12 | 
  13 | async function login(page: import("@playwright/test").Page, email: string, password: string) {
  14 |   await page.goto("/login");
  15 |   await page.fill("#email", email);
  16 |   await page.fill("#password", password);
  17 |   await page.getByRole("button", { name: /sign in/i }).click();
  18 |   await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  19 | }
  20 | 
  21 | test.describe("Finding Members API integration", () => {
  22 |   test("team leader sees matching candidates and can open public profile modal", async ({ page }) => {
  23 |     const candidateStatuses: number[] = [];
  24 |     page.on("response", (response) => {
  25 |       const url = response.url();
  26 |       if (
  27 |         url.includes("/matching/candidates") &&
  28 |         !url.includes("/profile") &&
  29 |         response.request().method() === "GET"
  30 |       ) {
  31 |         candidateStatuses.push(response.status());
  32 |       }
  33 |     });
  34 | 
  35 |     await login(page, TEAM_LEADER.email, TEAM_LEADER.password);
  36 | 
  37 |     const candidatesRequest = page.waitForResponse(
  38 |       (response) =>
  39 |         response.url().includes("/matching/candidates") &&
  40 |         !response.url().includes("/profile") &&
  41 |         response.request().method() === "GET",
  42 |     );
  43 |     await page.goto("/student/teams");
  44 |     const candidatesResponse = await candidatesRequest;
> 45 |     expect(candidatesResponse.status()).toBe(200);
     |                                         ^ Error: expect(received).toBe(expected) // Object.is equality
  46 | 
  47 |     await expect(page.getByText("Finding members")).toBeVisible({ timeout: 15_000 });
  48 | 
  49 |     const inviteButton = page.getByRole("button", { name: "Invite" }).first();
  50 |     if (await inviteButton.isVisible()) {
  51 |       await expect(inviteButton).toBeEnabled();
  52 |     }
  53 | 
  54 |     const viewProfileButton = page.getByRole("button", { name: "View Profile" });
  55 |     if (await viewProfileButton.count()) {
  56 |       const profileRequest = page.waitForResponse(
  57 |         (response) =>
  58 |           response.url().includes("/matching/candidates/") &&
  59 |           response.url().includes("/profile") &&
  60 |           response.request().method() === "GET",
  61 |       );
  62 |       await viewProfileButton.first().click();
  63 |       const profileResponse = await profileRequest;
  64 |       expect(profileResponse.status()).toBe(200);
  65 |       await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
  66 |       await page.getByRole("button", { name: "Close" }).click();
  67 |     }
  68 | 
  69 |     expect(candidateStatuses.some((status) => status === 200)).toBeTruthy();
  70 |   });
  71 | 
  72 |   test("participant can update matching profile", async ({ page }) => {
  73 |     await login(page, NO_TEAM_STUDENT.email, NO_TEAM_STUDENT.password);
  74 |     await page.goto("/student/teams");
  75 | 
  76 |     await expect(page.getByText("Your matching profile")).toBeVisible({ timeout: 15_000 });
  77 | 
  78 |     const lookingCheckbox = page.getByRole("checkbox", { name: /looking for a team/i });
  79 |     await lookingCheckbox.check();
  80 | 
  81 |     const saveRequest = page.waitForResponse(
  82 |       (response) =>
  83 |         response.url().includes("/enrollments/my/matching-profile") &&
  84 |         response.request().method() === "PUT",
  85 |     );
  86 |     await page.getByRole("button", { name: /save profile/i }).click();
  87 |     const saveResponse = await saveRequest;
  88 |     expect(saveResponse.status()).toBe(200);
  89 |     await expect(page.getByText("Saved")).toBeVisible();
  90 |   });
  91 | });
  92 | 
```