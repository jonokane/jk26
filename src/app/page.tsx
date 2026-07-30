import { Hero } from "@/components/hero/hero";
import { SiteHeader } from "@/components/site-header";
import { About } from "@/components/about/about";
import { Work } from "@/components/work/work";
import { Contact } from "@/components/contact/contact";
import { SiteFooter } from "@/components/site-footer";
import { ScrollButton } from "@/components/scroll-button";
import { HashScroll } from "@/components/hash-scroll";
import { ContactReached } from "@/components/analytics/contact-reached";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <About />
        <Work />
        <Contact />
      </main>
      <SiteFooter />
      <ScrollButton />
      <HashScroll />
      {/* Fires contact_reached once when Contact scrolls into view. One-pager
          only, so it never runs on /work/[slug]. Renders nothing. */}
      <ContactReached />
    </>
  );
}
