/**
 * All site copy lives here, never in JSX (spec §15). Section copy for
 * About/Work/Contact is placeholder until Phases 3–5 build the real
 * sections.
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
  /** Section heading titles (nav labels differ deliberately: "Work" vs "Selected Work"). */
  titles: {
    about: "About",
    work: "Selected Work",
    contact: "Contact",
  },
  placeholders: {
    about: "The story assembles here next: four beats collecting into an About wall.",
    work: "The work shelf arrives here: five case studies, read in full, on one horizontal shelf.",
    contact: "The contact form lands here. Until then: jono@collaya.com.",
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
  /** Outbound links used by the About CTAs (spec §7) and contact fallback. */
  links: {
    email: "jono@collaya.com",
    linkedin: "https://linkedin.com/in/jonokane",
    collaya: "https://collaya.com",
    /** No public résumé URL yet. The Résumé pill stays hidden while this is empty. */
    resume: "",
  },
} as const;
