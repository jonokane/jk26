import { ImageResponse } from "next/og";

/* The browser-tab favicon: a stark JK monogram, white on black so it reads on
   both light and dark tab strips. Next wires the <link rel="icon"> automatically
   and replaces the old create-next-app default. */

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: -2,
        }}
      >
        JK
      </div>
    ),
    { ...size },
  );
}
