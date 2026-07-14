/**
 * All site copy lives here, never in JSX (spec §15).
 *
 * Locked copy (Jono's own words, do not rewrite): `kicker`, `tagline`, `beats`.
 * Drafted copy awaiting his edit: `about.lede`, `work.intro`, `contact.*`.
 * House style: no em-dashes anywhere in visitor-facing copy.
 */
export const siteContent = {
  kicker: "Product Design Leader & Strategist",
  tagline:
    "I shape strategy, build teams, lead design, and code the front end that brings it to life.",
  nav: [
    { label: "About", target: "about" },
    { label: "Work", target: "work" },
    { label: "Contact", target: "contact" },
  ],
  /** Control + landmark labels (accessible names are copy too — spec §15). */
  labels: {
    backToTop: "Back to top",
    home: "Jono Kane — home",
    allWork: "← All work",
  },
  /** Section heading titles (nav labels differ deliberately: "Work" vs "Selected Work"). */
  titles: {
    about: "About",
    work: "Selected Work",
    contact: "Contact",
  },
  /** The four intro beats that collect into the About wall (spec §7). Locked copy. */
  beats: [
    {
      title: "What I do",
      statement:
        "I help teams build products people love, spanning design, product management, strategy, and hands-on building to turn concept and vision into shipped products.",
    },
    {
      title: "Track record",
      statement:
        "For two decades I have solved challenging product and UX problems at Yahoo!, Amazon, Meta, and smaller startups, and now as founder of Collaya.",
    },
    {
      title: "How I work",
      statement:
        "I care about people and real user needs, and I balance that with the metrics that grow a business.",
    },
    {
      title: "Available now",
      statement:
        "Available now for fractional work, around 20+ hours a week, mostly with early-stage teams in music, creative, AI, IoT, and automotive. Remote-first, open to LA or SF hybrid for the right opportunity.",
    },
  ],
  /** About section: the lede above the wall, and the CTAs below it (spec §7). */
  about: {
    lede: "Twenty years shipping products at Yahoo!, Amazon, and Meta, and now as founder of Collaya. Equal parts designer, design manager, and product strategist, with enough front-end fluency to build what I draw.",
    ctas: {
      work: "See the work",
      contact: "Start a conversation",
    },
    /** Secondary pills. A link with an empty href is not rendered. */
    secondary: [
      { label: "Résumé", key: "resume" },
      { label: "LinkedIn", key: "linkedin" },
      { label: "Collaya", key: "collaya" },
    ],
  },
  /** Work section (spec §8). */
  work: {
    intro:
      "Each study is the whole story: what it was, what made it hard, what I did, and what happened.",
    earlierTitle: "Selected earlier work",
    nextLabel: "Next",
    metaLabels: {
      client: "Client",
      sector: "Sector",
      discipline: "Discipline",
      platform: "Platform",
      role: "Role",
      timeframe: "Timeframe",
      view: "View the work",
    },
  },
  /** Contact section (spec §10). */
  contact: {
    lede: "Tell me what you are building. I read everything that comes through here.",
    fields: {
      name: "Name",
      email: "Email",
      message: "What are you building?",
    },
    submit: "Start a conversation",
    sending: "Sending",
    success: "Thanks, I will get back to you soon.",
    error: "Something went wrong on my end. Email me directly and I will pick it up:",
  },
  /** Outbound links used by the About CTAs (spec §7) and contact fallback. */
  links: {
    email: "jono@collaya.com",
    linkedin: "https://linkedin.com/in/jonokane",
    collaya: "https://collaya.com",
    /** No public résumé URL yet. The Résumé pill stays hidden while this is empty. */
    resume: "",
  },
} as const;
