import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";
import { siteContent } from "@/lib/site-content";

/* The site-wide default share card (home, and any case study without a cover).
   Case studies with a cover override this via generateMetadata. Rendered with
   next/og's built-in font — deliberately not Mae (Typekit isn't available to
   the OG generator), but a clean stark card in the site's black-on-white. */

export const alt = `${SITE_NAME} · ${siteContent.kicker}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          color: "#111111",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 10, fontWeight: 700 }}>
          JONOKANE
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 112, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>
            {SITE_NAME}
          </div>
          <div style={{ display: "flex", fontSize: 44, color: "#555555", marginTop: 22 }}>
            {siteContent.kicker}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#999999", letterSpacing: 2 }}>
          jonokane.com
        </div>
      </div>
    ),
    { ...size },
  );
}
