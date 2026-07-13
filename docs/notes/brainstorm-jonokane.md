# High-level brainstorm for [jonokane.com](http://jonokane.com)

*Note: This is all just stream of consciousness, so let me know if something doesn’t make sense \- ask any Qs which will help us align on the best possible outcome. Ideally, I’d love to jump straight into prototyping some mockups based on the above outline.*

# Visual Design

* Sleek, modern, playful, fun  
* Typeface: I have a set of typefaces I’d like to experiment with. Not sure which will look right, but I’ve added these to the typekit include:   
  * font-family: "fredoka-variable", sans-serif;font-variation-settings: "wdth" 100, "wght" 300;  
  * font-family: "mae-variable", sans-serif;font-variation-settings: "wght" 379;  
  * font-family: "cofo-sans-variable", sans-serif;font-variation-settings: "slnt" 0, "wght" 300;  
* Colors/Background treatment: I envision a dynamic vector+gradient background and various subtle vector elements which shift/change throughout the day, based on the user’s own time. So: background colors (gradients), foreground colors (which sit legibly over the background), and some relevant vector elements all shift through the day. Last night, when I envisioned this, a deep dark blue to light cyan / purple gradient, with small vector stars, because it was 12:02 AM. If someone looks at the site around 6am, they see a dark purple-amber gradient depicting dawn, with subtle “god rays”, as the sun is coming up… I envision this starting with the hero/greeting/main index page, where the ‘jono kane’ dynamic font animation is animating… maybe middle-left justified (as is now) or possible bottom-left justified (I’d have to compare the two). During the middle of the day, more of a bright, playful, almost cartoonish, poppy blue sky, some lil fluffy vector clouds, etc.   
* To successfully build a site which changes ‘vibe’ (colors mainly), I’m assuming we’d need to set up \~6 different ‘scenes’ with different background/foreground colors, and then those colors are keyframe-mapped to different parts of the day, then tweened, depending on the specific time? e.g. if there’s a 3pm keyframe and a 6pm keyframe, but someone hit the site at 4:30pm, the colors would be a blend between the 3pm and 6pm keyframes? Additionally, I mentioned those random vector elements \- so we’d have stars at night, maybe sun rays, an occasional cloud or bird float by during the day. Those would need to be animated in a random and fun way. 

# Navigation

I envision a simple 4 ‘page’ nav, all accessible by either vertical scroll or the user can click on the top nav items to scroll-snap to a different location. 

The site navigation could rely heavily on parallax vertical scroll: as the user interacts with the site, and scrolls vertically, that nice welcome hero text blob smoothly moves up and into a main topnav. As the user scrolls vertically, it snaps into a top-left-justified layout, with navigational elements filling the top-nav. User can click on those nav links, and the site scroll-snaps to the different section. If the user navigates back to index, the hero text blob slides back down to main greeting layout.   
Additionally, maybe the navigational rule is: vertical scroll for the intro and the different sections, horizontal scroll within downline sections.

# Content

**01 Welcome:**   
Product Design Leader & Strategist  
JonoKane  
I design products, systems, and the motion that ties them together.   
	\[🡓\](Intro 01\)  
\[vertical scroll\]  
**Intro 01**:   
I help teams build products people love, working as a seasoned design, product, and strategy partner.  
\[vertical scroll\]  
**Intro 02**:   
For two decades I have solved hard product and UX problems at Yahoo, Amazon, and Meta, and today as the founder of Collaya.  
\[vertical scroll\]  
**Intro 03**:   
I move easily between product design, product management, strategy, and hands-on building, so a small team can get senior judgment and shipped work from a single person.  
\[vertical scroll\]  
**Intro 04**:   
I care about people and real user needs, and I hold that alongside the metrics that grow a business.  
\[vertical scroll\]  
**Intro 05**:   
Right now I am taking on a few fractional engagements, mostly with early-stage teams in music, creative, and AI.  
\[vertical scroll\]  
**Intro 06**:   
Hire me for fractional work. Around 20 hours a week. Remote, with LA-based hybrid for the right opportunity.  
	**CTA buttons:** \[See the work\](/work) · \[Start a conversation\] (/contact)

\[vertical scroll\]

**02 Work**   
(Horizontal Scroll for each work case study entry): 

* Collaya  
  * Case Study  
* Tappa  
  * Case Study  
* Meta Project 1  
  * Case Study  
* Meta Project 2  
  * Case Study  
* Amazon Key In-Car Delivery  
  * Case Study  
* Amazon Key In-Home Delivery  
  * Case Study  
* 8tracks: First-Time User Experience  
  * Case Study  
* Fluence: Platform and Website  
  * Case Study  
* (Older Projects)…

**03 Contact:**   
Simple contact form which has the usual spam-prevention stuff in place. Name, email, body fields. 

**04 About:**   
A small bio (tbd) with links to my résumé, personal social media, and Collaya.  
