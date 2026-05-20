import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
          width: "512px",
          height: "512px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "96px",
          color: "white",
          fontSize: 320,
          fontWeight: 800,
        }}
      >
        E
      </div>
    ),
    { width: 512, height: 512 }
  );
}
