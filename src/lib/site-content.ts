/**
 * All site copy lives here, never in JSX (spec §15).
 *
 * Locked copy (Jono's own words, do not rewrite): `kicker`, `tagline`,
 * `howILead`. The tagline was rewritten by Jono for the leadership refresh
 * (2026-11-07) and is locked again as written. `howILead`'s eyebrow, title and
 * principles 04 and 05 were redrafted with Jono and approved by him
 * (2026-11-08); locked as written.
 * Drafted copy awaiting his edit: `work.filters.empty`, `contact.*`.
 * The About statements live in content/site/about.mdx, not here.
 * House style: no em-dashes anywhere in visitor-facing copy.
 */
export const siteContent = {
  /* The ` ` (no-break space) glues "& Strategist" together so a narrow
     viewport breaks the line after "Leader" — "Product Design Leader /
     & Strategist" — never orphaning "Strategist" on its own line. Invisible on
     one line (desktop) and reads as a normal space everywhere, including the
     document title that composes this string. */
  kicker: "Product Design Leader &\u00A0Strategist",
  tagline:
    "I build and support design teams that keep the bar high, from first sketch to launch.",
  /** The hero wordmark and the nav brand render this. */
  wordmark: "JONOKANE",
  /** The site sign-off footer, at the very bottom of the one-pager. Jono's words. */
  footer:
    "Made with ❤️ by Jono in LA, ©2026 (unless otherwise noted). Thanks for stopping by. Have a rad day!",
  nav: [
    { label: "About", target: "about" },
    { label: "Work", target: "work" },
    { label: "Contact", target: "contact" },
  ],
  /** Control + landmark labels (accessible names are copy too — spec §15). */
  labels: {
    backToTop: "Back to top",
    home: "Jono Kane • home",
    allWork: "← All work",
    /** The floating scroll aid: nudges down the page, and flips to "Top" (a
     *  scroll-to-top) once the reader reaches the very bottom. */
    scroll: "Scroll",
    top: "Top",
    /** The header's résumé link, after the section links and a hairline.
     *  Hidden while `links.resume` is empty. */
    resume: "Résumé",
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
  /** The "How I lead" card: a sub-section of About, rendered after the
   *  teleprompter (never inside its statement column). Jono's words, locked.
   *  The principle numbers are a CSS counter, not copy. `resumeCta` links to
   *  `links.resume` and is hidden while that is empty — Contact's rule. */
  howILead: {
    /** The mono label above the title: the plain name for the sub-section. */
    eyebrow: "How I lead",
    title: "Design leadership, in practice",
    lede: "My style is support. I give my team what they need, offer design input where it helps, and get out of the way so people have room to grow.",
    principles: [
      {
        title: "Teams that bond.",
        body: "I build teams that genuinely like working together, with a respectful space for regular critique, product reviews and testing. I keep them insulated from turbulence so they can do their best work.",
      },
      {
        title: "Hiring well.",
        body: "I've interviewed and hired designers at Meta, Amazon and 8tracks, and partnered with hiring teams to assess talent.",
      },
      {
        title: "Mentorship, both ways.",
        body: "I've always had mentors, and I still mentor designers whenever I can.",
      },
      {
        title: "Making the case.",
        body: "I've had my share of wins and losses, and I pass along what both taught me. I help designers make the case in terms their partners care about.",
      },
      {
        title: "Craft is more than polish.",
        body: "Craft is the thinking and care behind how something works, not just how it looks. I coach designers to bring that care to every decision, from the first flow to the final pixel.",
      },
    ],
    resumeCta: "Grab my résumé",
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
    lede: "Say hi. Get in touch with me here.",
    fields: {
      name: "Name",
      email: "Email",
      message: "What's going on?",
    },
    /** The footer's links, in order. Each `key` indexes `links` below for its
     *  href; `resume` is hidden while that href is empty — the same rule the
     *  About CTA follows. The email renders as a mailto. Read.cv (the prototype's
     *  third link) is dropped: sunset in 2024 and not in `links`. */
    footerLinks: [
      { label: "LinkedIn", key: "linkedin" },
      { label: "GitHub", key: "github" },
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
      message: "Tell me a little about what's on your mind.",
    },
  },
  /** Outbound links used by the About CTAs (spec §7) and contact fallback. */
  links: {
    email: "contact@jonokane.com",
    linkedin: "https://linkedin.com/in/jonokane",
    github: "https://github.com/jonokane",
    collaya: "https://collaya.com",
    /** Every résumé link (header, How I lead, Contact) points here and hides
     *  if this is empty. A placeholder, visible everywhere by Jono's call
     *  (2026-11-08): it 404s until the PDF lands at public/resume.pdf. */
    resume: "/resume.pdf",
  },
} as const;
