import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { siteContent } from "@/lib/site-content";

/* Off the home page the header is static: no scroll choreography, so these
   tests cover the nav's links and nothing else. */
vi.mock("next/navigation", () => ({ usePathname: () => "/work/example" }));

/* jsdom has no IntersectionObserver; the scroll-spy constructs one on mount.
   It never fires here, and the spy's behavior is not under test. */
if (typeof window.IntersectionObserver === "undefined") {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

afterEach(() => {
  cleanup();
  vi.resetModules();
  vi.doUnmock("@/lib/site-content");
});

/* Render against a site-content whose résumé URL is `resume`, whatever the real
   file says today, so both sides of the hide rule stay tested. */
async function renderWithResume(resume: string) {
  vi.resetModules();
  vi.doMock("@/lib/site-content", () => ({
    siteContent: { ...siteContent, links: { ...siteContent.links, resume } },
  }));
  const { SiteHeader } = await import("@/components/site-header");
  return render(<SiteHeader />);
}

describe("SiteHeader résumé link", () => {
  it("ends the nav's links with the résumé, opening the PDF in a new tab", async () => {
    await renderWithResume("/resume.pdf");
    const nav = screen.getByRole("navigation", { name: "Site" });
    const resume = within(nav).getByRole("link", { name: siteContent.labels.resume });
    expect(resume.getAttribute("href")).toBe("/resume.pdf");
    expect(resume.getAttribute("target")).toBe("_blank");
    /* After About, Work and Contact: the file sits past the section links. */
    expect(within(nav).getAllByRole("link").at(-1)).toBe(resume);
  });

  it("is never marked as the current section", async () => {
    await renderWithResume("/resume.pdf");
    const resume = screen.getByRole("link", { name: siteContent.labels.resume });
    expect(resume.hasAttribute("aria-current")).toBe(false);
  });

  it("hides the résumé link while links.resume is empty", async () => {
    await renderWithResume("");
    expect(screen.queryByRole("link", { name: siteContent.labels.resume })).toBeNull();
  });
});
