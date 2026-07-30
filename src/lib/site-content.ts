/**
 * All site copy lives here, never in JSX (spec §15).
 *
 * Locked copy (Jono's own words, do not rewrite): `kicker`, `tagline`.
 * Drafted copy awaiting his edit: `work.filters.empty`, `contact.*`.
 * The About statements live in content/site/about.mdx, not here.
 * House style: no em-dashes anywhere in visitor-facing copy.
 */
export const siteContent = {
  kicker: "Product Design Leader & Strategist",
  tagline:
    "I shape strategy, build teams, lead design, and bring digital products to life.",
  /** The hero wordmark and the nav brand render this. */
  wordmark: "JONOKANE",
  /** The site sign-off footer, at the very bottom of the one-pager. Jono's words. */
  footer:
    "Made with a smile by Jono in LA ©2026 (unless otherwise noted). Thanks for stopping by. Have a rad day!",
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
    /** The floating scroll aid: nudges down the page, and flips to "Top" (a
     *  scroll-to-top) once the reader reaches the very bottom. */
    scroll: "Scroll",
    top: "Top",
    /* No aboutRail label. The teleprompter's rail of dots (spec §8) is a
       decorative progress indicator with nothing to activate, so it is
       aria-hidden and has no accessible name to write. */
    /** The theme control names the mode it switches TO, not the current one. */
    theme: {
      toLight: "Light",
      toDark: "Dark",
    },
  },
  /** Section heading titles, all sentence case with a full stop, per the
   *  prototype. Nav labels deliberately differ from them: "Work" vs
   *  "Selected work.", "Contact" vs "Let's talk."
   *  `about` is currently read by nothing — the About h2 renders its own title
   *  from content/site/about.mdx. */
  titles: {
    about: "Nice to meet you",
    work: "Selected work",
    contact: "Let's talk",
  },
  /** About section CTAs, below the teleprompter (spec §7). The title and
   *  statements live in content/site/about.mdx. */
  about: {
    /** Caption under the tray of pocketed beats, while the reader is still reading. */
    trayHint: "Collected ↓",
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
  /** Work section (spec §9). Two views over one dataset. */
  work: {
    earlierTitle: "Selected earlier work.",
    nextLabel: "Next",
    /** The view toggle — a two-segment control showing both views, the active
     *  one selected. */
    galleryLabel: "Gallery",
    indexLabel: "Index",
    /** The segmented control's group name, for assistive tech. */
    viewToggleLabel: "Choose a view",
    /** The card's call to action. The arrow beside it is CSS content, not copy. */
    viewLabel: "View case study",
    /** The earlier-item modal's outbound link to a still-live project. The arrow
     *  beside it is CSS content, not copy. */
    viewLiveLabel: "View live",
    /** Sits in a card's image slot until a real `cover` is set in frontmatter. */
    shotPending: "Case study imagery in progress",
    // The detail surface's wide image slot caption (spec §10, the prototype's
    // ".dshot" — "selected screens / artifacts").
    detailShotCaption: "Selected screens / artifacts",
    // The modal's close pill. The "✕" is decoration, added in CSS, so the
    // accessible name stays the plain word (spec §15).
    detailCloseLabel: "Close",
    /** The image lightbox's close control (spec 2026-07-28). "✕" is CSS. */
    lightboxCloseLabel: "Close",
    /** Accessible name for a zoomable figure's button, and the fallback when an
     *  image has no alt. Paired with aria-haspopup="dialog" to convey "enlarge". */
    zoomActionLabel: "Enlarge image",
    /** The inline click-to-advance slide gallery (<Slides>). `status` is the
     *  live-region announcement read on each step. */
    slides: {
      label: "Screen-by-screen walkthrough",
      prev: "Previous screen",
      next: "Next screen",
      hint: "Click, or use ← → to step through",
      status: (n: number, total: number) => `Screen ${n} of ${total}`,
    },
    /** Between the active card's number and the total: "01 / 05". */
    counterSeparator: " / ",
    /** The gallery's own landmark name. */
    region: "Selected work gallery",
    filters: {
      sector: "Sector",
      discipline: "Discipline",
      clear: "Clear filters",
      /** Shown when the two facets AND down to nothing. Not a rare edge: with
       *  the studies published today, 4 of the 20 two-facet combinations match
       *  no study, so one filter click in five lands here. Without it the rows
       *  simply vanish and the index reads as broken. Drafted — Jono's to edit. */
      empty: "No studies match those filters.",
      /** The filter bar's landmark name. */
      region: "Filter the work",
      /** Joins a filter pill's facet to its value in the ACCESSIBLE name only:
       *  the pill shows "Music", a screen reader hears "Sector: Music". Without
       *  it the control is a button called "Music" with no stated subject. */
      pillPrefix: ": ",
    },
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
  /** Contact section (spec §12). */
  contact: {
    lede: "Tell me what you are building. I read everything that comes through here.",
    fields: {
      name: "Name",
      email: "Email",
      message: "What are you building?",
    },
    /** The footer's links, in order. Each `key` indexes `links` below for its
     *  href; `resume` is hidden while that href is empty — the same rule the
     *  About CTA follows. The email renders as a mailto. Read.cv (the prototype's
     *  third link) is dropped: sunset in 2024 and not in `links`. */
    footerLinks: [
      { label: "LinkedIn", key: "linkedin" },
      { label: "Collaya", key: "collaya" },
      { label: "Résumé", key: "resume" },
    ],
    submit: "Start a conversation",
    sending: "Sending",
    /** The success state (spec §12): the form fades out and this panel rises in,
        echoing what was sent, with a button to send another. */
    success: {
      title: "Message sent.",
      subline: "It's on its way to my inbox.",
      yourMessageLabel: "Your message",
      fromLabel: "From",
      sendAnother: "Send another message",
    },
    error: "Something went wrong on my end. Email me directly and I will pick it up:",
    /** Field validation copy. The browser's native messages are off-brand, so
        we supply our own and hand them to setCustomValidity (spec §15). */
    validation: {
      name: "Your name, so I know who I am talking to.",
      email: "An email address, so I can write back.",
      emailInvalid: "That email address does not look quite right.",
      message: "Tell me a little about what you are building.",
    },
  },
  /** Outbound links used by the About CTAs (spec §7) and contact fallback. */
  links: {
    email: "contact@jonokane.com",
    linkedin: "https://linkedin.com/in/jonokane",
    collaya: "https://collaya.com",
    /** No public résumé URL yet. The Résumé pill stays hidden while this is empty. */
    resume: "",
  },
} as const;
