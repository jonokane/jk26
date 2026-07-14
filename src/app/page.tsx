import { Hero } from "@/components/hero/hero";
import { SiteHeader } from "@/components/site-header";
import { About } from "@/components/about/about";
import { Work } from "@/components/work/work";
import { Contact } from "@/components/contact/contact";
import { Farewell } from "@/components/farewell/farewell";
import { HashScroll } from "@/components/hash-scroll";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <About />
        <Work />
        <Contact />
        <Farewell />
      </main>
      <HashScroll />
    </>
  );
}
