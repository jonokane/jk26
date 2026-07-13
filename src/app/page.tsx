import { Hero } from "@/components/hero/hero";
import { SiteHeader } from "@/components/site-header";
import { AnchorSection } from "@/components/anchor-section";
import { HashScroll } from "@/components/hash-scroll";
import { SceneProvider } from "@/components/sky/scene-provider";
import { Sky } from "@/components/sky/sky";
import { SunMoon } from "@/components/sky/sun-moon";
import { Rays } from "@/components/sky/rays";
import { Stars } from "@/components/sky/stars";
import { Clouds } from "@/components/sky/clouds";
import { Birds } from "@/components/sky/birds";
import { TimeScrubber } from "@/components/sky/time-scrubber";
import { SceneTunePanel } from "@/components/sky/scene-tune-panel";
import { siteContent } from "@/lib/site-content";

export default function Home() {
  return (
    <SceneProvider>
      <Sky>
        <SunMoon />
        <Rays />
        <Stars />
        <Clouds />
        <Birds />
      </Sky>
      <SiteHeader />
      <main>
        <Hero />
        <AnchorSection id="about" title="About">
          {siteContent.placeholders.about}
        </AnchorSection>
        <AnchorSection id="work" title="Selected Work">
          {siteContent.placeholders.work}
        </AnchorSection>
        <AnchorSection id="contact" title="Contact">
          {siteContent.placeholders.contact}
        </AnchorSection>
      </main>
      <HashScroll />
      <TimeScrubber />
      <SceneTunePanel />
    </SceneProvider>
  );
}
