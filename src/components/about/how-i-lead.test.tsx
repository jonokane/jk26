import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { siteContent } from "@/lib/site-content";

afterEach(() => {
  cleanup();
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
  it("titles the card with an h3, under About's h2", async () => {
    await renderWithResume("");
    const heading = screen.getByRole("heading", { level: 3, name: siteContent.howILead.title });
    expect(heading).toBeTruthy();
    /* The card is a named group, so assistive tech hears "How I lead" as the
       boundary of what follows. */
    expect(screen.getByRole("group", { name: siteContent.howILead.title })).toBeTruthy();
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

  /* Never ship the from-state in server HTML: without JS (or before the hook
     arms) the card must be plainly visible. jsdom has no IntersectionObserver,
     so the hook never arms here — exactly the no-JS path. */
  it("renders with no reveal from-state before the hook arms", async () => {
    const { container } = await renderWithResume("");
    const card = container.querySelector("[role='group']");
    expect(card?.hasAttribute("data-reveal")).toBe(false);
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
