import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
          width: "192px",
          height: "192px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "38px",
          color: "white",
          fontSize: 120,
          fontWeight: 800,
        }}
      >
        E
      </div>
    ),
    { width: 192, height: 192 }
  );
}
