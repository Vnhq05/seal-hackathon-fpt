export type LandingEvent = {
  id: number;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  format: "Online" | "Offline" | "Hybrid";
  registrationStatus: "Open" | "Closed";
  accent: string;
};

/* Demo data — replace with GET /api/public/competitions */
export const FEATURED_EVENTS: LandingEvent[] = [
  {
    id: 1,
    name: "SEAL AI Odyssey 2026",
    category: "Artificial Intelligence",
    startDate: "Aug 15, 2026",
    endDate: "Aug 17, 2026",
    location: "Ho Chi Minh City, Vietnam",
    format: "Hybrid",
    registrationStatus: "Open",
    accent: "cyan",
  },
  {
    id: 2,
    name: "Ocean Impact Challenge",
    category: "Sustainability",
    startDate: "Sep 5, 2026",
    endDate: "Sep 7, 2026",
    location: "Online",
    format: "Online",
    registrationStatus: "Open",
    accent: "mint",
  },
  {
    id: 3,
    name: "Cyber Defense Sprint",
    category: "Cybersecurity",
    startDate: "Oct 10, 2026",
    endDate: "Oct 12, 2026",
    location: "Hanoi, Vietnam",
    format: "Offline",
    registrationStatus: "Closed",
    accent: "purple",
  },
];

export type HowItWorksStep = {
  num: string;
  title: string;
  description: string;
};

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    num: "01",
    title: "Discover",
    description:
      "Browse active hackathons across categories — AI, web, mobile, sustainability and more.",
  },
  {
    num: "02",
    title: "Form Your Crew",
    description:
      "Build a team with complementary skills or join an existing crew looking for talent.",
  },
  {
    num: "03",
    title: "Build & Submit",
    description:
      "Develop your solution, iterate with mentor feedback, and submit before the deadline.",
  },
  {
    num: "04",
    title: "Compete & Launch",
    description:
      "Present to judges, earn recognition, and turn your prototype into something real.",
  },
];

export type Track = {
  name: string;
  description: string;
  accent: string;
  span?: string;
};

export const TRACKS: Track[] = [
  {
    name: "Artificial Intelligence",
    description: "Build intelligent systems that learn, adapt and solve complex problems.",
    accent: "cyan",
    span: "col-span-2",
  },
  {
    name: "Web & Cloud",
    description: "Craft scalable web apps and cloud-native solutions.",
    accent: "blue",
  },
  {
    name: "Mobile Experience",
    description: "Design mobile-first experiences that people love to use.",
    accent: "pink",
  },
  {
    name: "Sustainability",
    description: "Create tech that drives environmental and social impact.",
    accent: "mint",
  },
  {
    name: "Cybersecurity",
    description: "Defend systems, detect threats, and secure the digital frontier.",
    accent: "purple",
    span: "col-span-2",
  },
  {
    name: "Open Innovation",
    description: "No limits — build whatever pushes the boundary.",
    accent: "yellow",
  },
];

export type PlatformFeature = {
  title: string;
  description: string;
};

export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    title: "Discover Competitions",
    description: "Browse and filter active hackathons by category, format, and deadline.",
  },
  {
    title: "Team Management",
    description: "Create teams, invite members, and coordinate work in one place.",
  },
  {
    title: "Round-Based Submissions",
    description: "Submit projects by round with versioning and deadline tracking.",
  },
  {
    title: "Mentor Support",
    description: "Connect with experienced mentors for guidance and feedback.",
  },
  {
    title: "Transparent Judging",
    description: "Structured scoring criteria with clear rubrics and judge assignments.",
  },
  {
    title: "Live Rankings",
    description: "Real-time leaderboards and results across all competition rounds.",
  },
];

/* Demo statistics — replace with real API data */
export const STATS = [
  { value: "24+", label: "Hackathons" },
  { value: "1,200+", label: "Builders" },
  { value: "300+", label: "Teams" },
  { value: "80+", label: "Mentors & Judges" },
];
