export type LandingEvent = {
  id: number;
  name: string;
  theme: string;
  registrationPeriod: string;
  workshop?: { date: string; title: string };
  openingDate: string;
  competitionDay: string;
  location: string;
  format: "Online" | "Offline" | "Hybrid";
  registrationStatus: "Open" | "Upcoming" | "Closed";
  statusLabel: string;
  prizes: { place: string; reward: string }[];
  participationNote: string;
};

export const FEATURED_EVENT: LandingEvent = {
  id: 1,
  name: "SEAL Hackathon Spring 2026",
  theme: "Mastering Domain-Specific AI RAG Systems",
  registrationPeriod: "March 15 - March 25, 2026",
  workshop: {
    date: "April 9, 2026",
    title: "The RAG Revolution: Transforming Complex Data into Actionable Domain Insights",
  },
  openingDate: "April 11, 2026",
  competitionDay: "April 12, 2026 (Coding → Pitching → Finals → Closing Ceremony)",
  location: "FPT University HCM",
  format: "Offline",
  registrationStatus: "Open",
  statusLabel: "Registration Open",
  prizes: [
    { place: "1st Place", reward: "7,000,000 VND + Certificate" },
    { place: "2nd Place", reward: "5,000,000 VND + Certificate" },
    { place: "3rd Place", reward: "3,000,000 VND + Certificate" },
    { place: "Honorable Mention", reward: "1,500,000 VND + Certificate" },
  ],
  participationNote: "All participants receive a Certificate of Participation",
};

export type HackathonSeason = {
  season: "Spring" | "Summer" | "Fall";
  title: string;
  description: string;
  accentClass: string;
  borderClass: string;
};

export const HACKATHON_SERIES: HackathonSeason[] = [
  {
    season: "Spring",
    title: "Emerging Technologies",
    description:
      "AI, IoT, Blockchain, and cutting-edge research that pushes technical boundaries.",
    accentClass: "bg-royal/10 text-royal",
    borderClass: "border-royal/30",
  },
  {
    season: "Summer",
    title: "Product & User Experience",
    description:
      "User-centered products, UX optimization, and paths toward commercialization.",
    accentClass: "bg-seal-yellow/20 text-navy",
    borderClass: "border-navy/30",
  },
  {
    season: "Fall",
    title: "SDLC & Professional Working",
    description:
      "Software development lifecycle, professional skills, and industry readiness.",
    accentClass: "bg-seal-success/10 text-seal-success",
    borderClass: "border-seal-success/30",
  },
];

export type PlatformFeature = {
  title: string;
  description: string;
};

export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    title: "Event Management",
    description: "Configure hackathons, schedules, rounds, and announcements in one place.",
  },
  {
    title: "Team Registration",
    description: "Form teams of 3–5 members and manage enrollment from registration to finals.",
  },
  {
    title: "Track & Topic Draw System",
    description: "Randomized track and topic assignment on opening day for fair competition.",
  },
  {
    title: "Judging & Scoring",
    description: "Structured rubrics for Group Round and Finals with transparent evaluation.",
  },
  {
    title: "Submission & Source Code Tracking",
    description: "Track deliverables across GitHub, Confluence, Notion, and other linked tools.",
  },
  {
    title: "Ranking & Results",
    description: "Chapter, team, and individual leaderboards updated as scores are finalized.",
  },
];

export type HowItWorksStep = {
  title: string;
  description: string;
};

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: "Register & Join a Track",
    description:
      "Form a team of 3–5 members, complete registration, and choose your technology track.",
  },
  {
    title: "Draw Topics & Plan",
    description:
      "Day 1: opening ceremony, random topic draw, and repository setup for your build.",
  },
  {
    title: "Build & Pitch",
    description:
      "Day 2: code from 7AM–2PM, present to judges, and advance to the finals round.",
  },
  {
    title: "Win & Get Recognized",
    description:
      "Finals, award ceremony, and certificates for all participants who complete the event.",
  },
];

export type RoleCardData = {
  title: string;
  description: string;
  iconKey: "fpt-student" | "external-student" | "lecturer" | "coordinator" | "admin";
  bgClass: string;
  iconClass: string;
};

export const ROLE_CARDS: RoleCardData[] = [
  {
    title: "FPT Student",
    description: "FPT University HCMC participants competing in SEAL hackathons.",
    iconKey: "fpt-student",
    bgClass: "bg-royal/5",
    iconClass: "text-royal",
  },
  {
    title: "External Student",
    description: "Students from other universities in HCMC, participating by invitation.",
    iconKey: "external-student",
    bgClass: "bg-seal-yellow/15",
    iconClass: "text-navy",
  },
  {
    title: "Lecturer",
    description: "Academic supervisors and mentors guiding teams through the competition.",
    iconKey: "lecturer",
    bgClass: "bg-seal-success/10",
    iconClass: "text-seal-success",
  },
  {
    title: "Coordinator",
    description: "Event staff managing logistics, scheduling, and on-site operations.",
    iconKey: "coordinator",
    bgClass: "bg-seal-blue/10",
    iconClass: "text-seal-blue",
  },
  {
    title: "Admin",
    description: "Platform administrators overseeing users, events, and system configuration.",
    iconKey: "admin",
    bgClass: "bg-seal-error/5",
    iconClass: "text-seal-error",
  },
];

export type ScoringCriterion = {
  name: string;
  weight: number;
};

export type ScoringRound = {
  id: "group" | "finals";
  label: string;
  subtitle: string;
  criteria: ScoringCriterion[];
};

export const SCORING_ROUNDS: ScoringRound[] = [
  {
    id: "group",
    label: "Group Round",
    subtitle: "Vòng bảng",
    criteria: [
      { name: "Domain Accuracy & Relevance", weight: 30 },
      { name: "Agentic RAG Architecture", weight: 30 },
      { name: "Idea & Presentation", weight: 15 },
      { name: "Execution & Creativity", weight: 15 },
      { name: "UX & Interface", weight: 10 },
    ],
  },
  {
    id: "finals",
    label: "Finals",
    subtitle: "Vòng chung kết",
    criteria: [
      { name: "Data Processing & Retrieval Quality", weight: 30 },
      { name: "Reliability & Hallucination Resistance", weight: 20 },
      { name: "Agent Thinking & Multi-hop Reasoning", weight: 20 },
      { name: "Practicality & Operational Optimization", weight: 20 },
      { name: "Scalability & Innovation", weight: 10 },
    ],
  },
];

export const STATS = [
  { value: "3", label: "Hackathons per Year", detail: "Spring / Summer / Fall" },
  { value: "3", label: "Technology Tracks per Event", detail: null },
  { value: "6", label: "Finalist Teams per Hackathon", detail: null },
  { value: "1", label: "Platform for End-to-End Hackathon Management", detail: null },
];

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Who can register for SEAL Hackathons?",
    answer:
      "FPT University HCMC students and invited students from partner universities in Ho Chi Minh City can register in teams of 3–5 members.",
  },
  {
    question: "How does the track and topic draw work?",
    answer:
      "On opening day, teams receive a technology track and domain topic through a randomized draw system to ensure fair and varied competition.",
  },
  {
    question: "What do I need to submit during the hackathon?",
    answer:
      "Teams submit source code (via GitHub or linked repos), documentation (Confluence, Notion, etc.), and present their solution during pitching rounds.",
  },
  {
    question: "How are teams scored?",
    answer:
      "Judges evaluate teams using separate rubrics for the Group Round and Finals, covering technical quality, presentation, UX, and innovation.",
  },
  {
    question: "Do all participants receive recognition?",
    answer:
      "Yes. Every participant who completes the event receives a Certificate of Participation, in addition to prize awards for top-performing teams.",
  },
];

export const CTA_DEADLINE = "March 25, 2026";
