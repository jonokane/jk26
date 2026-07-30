import { ImageResponse } from "next/og";

/* The iOS home-screen / Apple touch icon — same JK monogram at 180×180 with a
   solid background (Apple icons must not be transparent; iOS rounds the corners). */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#ffffff",
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: -6,
        }}
      >
        JK
      </div>
    ),
    { ...size },
  );
}
