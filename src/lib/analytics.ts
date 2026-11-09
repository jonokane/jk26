import { track } from "@vercel/analytics";

/**
 * The single place site analytics events are named, typed, and fired.
 *
 * Event names and property labels are strings, and strings are copy — they live
 * here in config, never inline in a component (spec §14/§15). Every call site
 * imports `trackEvent` plus an entry from `ANALYTICS_EVENTS`; none passes a raw
 * event name or a hand-written property key.
 *
 * These are lead-gen signals, not vanity metrics: each event marks a step a
 * prospective client took toward getting in touch. Pageviews and client-side
 * route changes are tracked automatically by <Analytics/> (layout.tsx) — there
 * is deliberately no manual pageview code here.
 *
 * IMPORTANT: import and call this from CLIENT components only. Vercel's `track()`
 * is a no-op anywhere but the browser — Server Components, SSR, and unit tests
 * where the <Analytics/> script never mounts — so a stray non-client call is
 * harmless, but the event simply won't record. Fire from an event handler (or a
 * mount effect) inside a `"use client"` component.
 */

/** Event names. A component references these, never a bare string literal. */
export const ANALYTICS_EVENTS = {
  /** The contact form received a genuine success response from /api/contact. */
  contactSubmit: "contact_submit",
  /** The résumé PDF link was clicked. */
  resumeDownload: "resume_download",
  /** A case study was opened from the home page (a gallery card or index row). */
  caseStudyOpen: "case_study_open",
  /** An external link (email, LinkedIn, Collaya, …) was clicked. */
  outboundClick: "outbound_click",
  /** The Contact section scrolled into view — fired once per page load. */
  contactReached: "contact_reached",
} as const;

/**
 * Stable labels for `outbound_click`, so ONE event covers every external
 * destination and the `label` property does the filtering — fewer event names,
 * easier to slice, and it holds the payload to a single property (Vercel Pro
 * caps custom events at two). The values equal the keys under
 * `siteContent.links`, so a link's key doubles as its analytics label and
 * nothing is derived from the URL at the call site.
 */
export const OUTBOUND_LABELS = {
  email: "email",
  linkedin: "linkedin",
  github: "github",
  collaya: "collaya",
} as const;

export type OutboundLabel = (typeof OUTBOUND_LABELS)[keyof typeof OUTBOUND_LABELS];

/**
 * Each event's exact payload. Vercel Pro allows at most TWO properties per
 * custom event; every shape here is at or under that (none exceeds one).
 * `undefined` marks a propertyless event.
 */
type EventPayloads = {
  [ANALYTICS_EVENTS.contactSubmit]: undefined;
  [ANALYTICS_EVENTS.resumeDownload]: undefined;
  [ANALYTICS_EVENTS.caseStudyOpen]: { slug: string };
  [ANALYTICS_EVENTS.outboundClick]: { label: OutboundLabel };
  [ANALYTICS_EVENTS.contactReached]: undefined;
};

type EventName = keyof EventPayloads;

/* Split the events by whether they carry a payload, so the overloads below can
   forbid props on the propertyless events and require them on the rest. */
type PropfulEvent = { [E in EventName]: EventPayloads[E] extends undefined ? never : E }[EventName];
type PropfreeEvent = Exclude<EventName, PropfulEvent>;

/**
 * Fire a typed analytics event. The overloads make the payload mandatory for
 * events that define one and forbid it for those that don't, so a call can
 * never pass the wrong properties — or forget the slug.
 */
export function trackEvent(event: PropfreeEvent): void;
export function trackEvent<E extends PropfulEvent>(event: E, props: EventPayloads[E]): void;
export function trackEvent(event: EventName, props?: Record<string, string>): void {
  track(event, props);
}
