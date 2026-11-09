import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { siteContent } from "@/lib/site-content";

/* The route is not called in these tests — they cover the restyle's structure
   and the footer, not the submit logic (which the API route's own test covers). */
afterEach(cleanup);

const { Contact } = await import("@/components/contact/contact");

describe("Contact", () => {
  it("names the landmark and renders the sticky section title", () => {
    const { container } = render(<Contact />);
    const section = container.querySelector("section");
    expect(section?.getAttribute("id")).toBe("contact");
    expect(section?.getAttribute("aria-labelledby")).toBe("contact-title");
    expect(screen.getByRole("heading", { name: siteContent.titles.contact })).toBeTruthy();
  });

  it("renders the three labeled fields and the submit", () => {
    render(<Contact />);
    expect(screen.getByLabelText(siteContent.contact.fields.name)).toBeTruthy();
    expect(screen.getByLabelText(siteContent.contact.fields.email)).toBeTruthy();
    expect(screen.getByLabelText(siteContent.contact.fields.message)).toBeTruthy();
    expect(screen.getByRole("button", { name: siteContent.contact.submit })).toBeTruthy();
  });

  it("renders the footer: a mailto and the links that have a URL", () => {
    const { container } = render(<Contact />);
    const footer = container.querySelector("[data-contact-footer]");
    expect(footer).toBeTruthy();
    const scope = within(footer as HTMLElement);
    // email as a mailto
    expect(scope.getByRole("link", { name: siteContent.links.email }).getAttribute("href")).toBe(
      `mailto:${siteContent.links.email}`,
    );
    // LinkedIn, GitHub and Collaya have URLs -> rendered
    expect(scope.getByRole("link", { name: "LinkedIn" }).getAttribute("href")).toBe(
      siteContent.links.linkedin,
    );
    expect(scope.getByRole("link", { name: "GitHub" }).getAttribute("href")).toBe(
      "https://github.com/jonokane",
    );
    expect(scope.getByRole("link", { name: "Collaya" }).getAttribute("href")).toBe(
      siteContent.links.collaya,
    );
  });

  it("ends the footer with the résumé once links.resume has a URL", () => {
    const { container } = render(<Contact />);
    const footer = container.querySelector("[data-contact-footer]") as HTMLElement;
    const resume = within(footer).getByRole("link", { name: "Résumé" });
    expect(resume.getAttribute("href")).toBe(siteContent.links.resume);
    expect(within(footer).getAllByRole("link").at(-1)).toBe(resume);
  });

  /* A link with no URL must not render: the same rule How I lead's CTA and
     the header follow. Rendered against an emptied résumé URL, whatever the
     real file says, because this CONDITIONAL is the thing most likely to
     regress. */
  it("hides a footer link whose URL is empty", async () => {
    vi.resetModules();
    vi.doMock("@/lib/site-content", () => ({
      siteContent: { ...siteContent, links: { ...siteContent.links, resume: "" } },
    }));
    const { Contact: ContactNoResume } = await import("@/components/contact/contact");
    render(<ContactNoResume />);
    expect(screen.queryByRole("link", { name: "Résumé" })).toBeNull();
    vi.doUnmock("@/lib/site-content");
  });
});
