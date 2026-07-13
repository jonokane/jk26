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
    about: "The story assembles here next — four beats collecting into an About wall.",
    work: "The work shelf arrives here — five case studies, read in full, on one horizontal shelf.",
    contact: "The contact form lands here. Until then: jono@collaya.com.",
  },
} as const;
