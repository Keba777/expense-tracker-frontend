import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
          color: "white",
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        E
      </div>
    ),
    { ...size }
  );
}
