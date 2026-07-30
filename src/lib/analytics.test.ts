import { afterEach, describe, expect, it, vi } from "vitest";

/* Mock Vercel's SDK so a test asserts what `trackEvent` HANDS it, never that
   anything reaches the network. Same vi.hoisted pattern as the contact route's
   Resend mock. */
const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("@vercel/analytics", () => ({ track }));

import { ANALYTICS_EVENTS, OUTBOUND_LABELS, trackEvent } from "@/lib/analytics";

afterEach(() => track.mockClear());

describe("ANALYTICS_EVENTS", () => {
  it("carries the exact event names the Vercel dashboard filters on", () => {
    /* Change-detector: these strings ARE the analytics contract. Renaming one
       silently splits its history in the dashboard into a dead old name and a
       fresh empty one — so a rename must be deliberate, and update this test. */
    expect(ANALYTICS_EVENTS).toEqual({
      contactSubmit: "contact_submit",
      resumeDownload: "resume_download",
      caseStudyOpen: "case_study_open",
      outboundClick: "outbound_click",
      contactReached: "contact_reached",
    });
  });
});

describe("trackEvent", () => {
  it("forwards a propertyless event as just its name", () => {
    trackEvent(ANALYTICS_EVENTS.contactSubmit);
    expect(track).toHaveBeenCalledWith("contact_submit", undefined);
  });

  it("forwards an event's payload unchanged", () => {
    trackEvent(ANALYTICS_EVENTS.caseStudyOpen, { slug: "collaya" });
    expect(track).toHaveBeenCalledWith("case_study_open", { slug: "collaya" });
  });

  it("folds every outbound destination into one event via the label", () => {
    trackEvent(ANALYTICS_EVENTS.outboundClick, { label: OUTBOUND_LABELS.linkedin });
    expect(track).toHaveBeenCalledWith("outbound_click", { label: "linkedin" });
  });

  it("keeps every payload within the Vercel Pro cap of two properties", () => {
    /* Not a value assertion — a guard that no event grows a second/third
       property by accident, which Vercel Pro would drop. */
    trackEvent(ANALYTICS_EVENTS.caseStudyOpen, { slug: "x" });
    trackEvent(ANALYTICS_EVENTS.outboundClick, { label: OUTBOUND_LABELS.email });
    for (const [, props] of track.mock.calls) {
      if (props) expect(Object.keys(props).length).toBeLessThanOrEqual(2);
    }
  });
});
