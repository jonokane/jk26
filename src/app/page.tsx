import { Hero } from "@/components/hero/hero";
import { SiteHeader } from "@/components/site-header";
import { AnchorSection } from "@/components/anchor-section";
import { HashScroll } from "@/components/hash-scroll";
import { siteContent } from "@/lib/site-content";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <AnchorSection id="about" title={siteContent.titles.about}>
          {siteContent.placeholders.about}
        </AnchorSection>
        <AnchorSection id="work" title={siteContent.titles.work}>
          {siteContent.placeholders.work}
        </AnchorSection>
        <AnchorSection id="contact" title={siteContent.titles.contact}>
          {siteContent.placeholders.contact}
        </AnchorSection>
      </main>
      <HashScroll />
    </>
  );
}
