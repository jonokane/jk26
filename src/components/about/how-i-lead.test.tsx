import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { siteContent } from "@/lib/site-content";

const realMatchMedia = window.matchMedia;

function matchMediaReduced(reduced: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduced && q.includes("reduced-motion"),
    media: q, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  cleanup();
  window.matchMedia = realMatchMedia;
  vi.resetModules();
  vi.doUnmock("@/lib/site-content");
});

/* Render against a site-content whose résumé URL is `resume`, whatever the real
   file says today — so both sides of the hide rule are tested, and neither
   test silently flips when links.resume is filled in. */
async function renderWithResume(resume: string) {
  vi.resetModules();
  vi.doMock("@/lib/site-content", () => ({
    siteContent: { ...siteContent, links: { ...siteContent.links, resume } },
  }));
  const { HowILead } = await import("@/components/about/how-i-lead");
  return render(<HowILead />);
}

describe("HowILead", () => {
  it("titles the band with an h3, under About's h2", async () => {
    await renderWithResume("");
    const heading = screen.getByRole("heading", { level: 3, name: siteContent.howILead.title });
    expect(heading).toBeTruthy();
    /* The band is a named group, so assistive tech hears the title as the
       boundary of what follows. */
    expect(screen.getByRole("group", { name: siteContent.howILead.title })).toBeTruthy();
  });

  /* The eyebrow is what keeps this reading as part of About: a label, not a
     heading, so the outline stays About h2 > this h3. */
  it("puts the eyebrow above the title as plain text, not a heading", async () => {
    await renderWithResume("");
    const eyebrow = screen.getByText(siteContent.howILead.eyebrow);
    expect(eyebrow.tagName).toBe("P");
    const heading = screen.getByRole("heading", { level: 3 });
    expect(eyebrow.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders the lede and every principle from site-content, in order", async () => {
    await renderWithResume("");
    expect(screen.getByText(siteContent.howILead.lede)).toBeTruthy();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(siteContent.howILead.principles.length);
    siteContent.howILead.principles.forEach((p, i) => {
      const item = within(items[i]);
      expect(item.getByRole("heading", { level: 4, name: p.title })).toBeTruthy();
      expect(item.getByText(p.body)).toBeTruthy();
    });
  });

  /* Never ship a motion from-state in the server HTML: without JavaScript the
     band must be open and every card resolved. Effects never run in
     renderToString, which is exactly the no-JS path. */
  it("server-renders the finished band, with no motion from-state", async () => {
    vi.resetModules();
    const { HowILead } = await import("@/components/about/how-i-lead");
    const html = renderToString(<HowILead />);
    expect(html).not.toMatch(/style="/);
    for (const p of siteContent.howILead.principles) expect(html).toContain(p.title);
  });

  /* Reduced motion: no tween ever starts, so GSAP never writes an inline
     style onto the band or a card. */
  it("leaves every element untouched under reduced motion", async () => {
    matchMediaReduced(true);
    const { container } = await renderWithResume("");
    expect(container.querySelector("[style]")).toBeNull();
  });

  it("hides the résumé link while links.resume is empty", async () => {
    await renderWithResume("");
    expect(screen.queryByRole("link", { name: siteContent.howILead.resumeCta })).toBeNull();
  });

  it("shows the résumé link once links.resume has a URL", async () => {
    await renderWithResume("/jono-kane-resume.pdf");
    const link = screen.getByRole("link", { name: siteContent.howILead.resumeCta });
    expect(link.getAttribute("href")).toBe("/jono-kane-resume.pdf");
  });
});
