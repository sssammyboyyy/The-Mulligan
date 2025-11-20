import { ImageResponse } from "next/og"

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = "image/png"

// Image generation
export default function Icon() {
  return new ImageResponse(
    // ImageResponse JSX element
    <div
      style={{
        fontSize: 120,
        background: "#143B29", // Deep Forest Green
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#B88642", // Copper/Gold
        borderRadius: "32px",
        fontFamily: "Times New Roman, serif",
        fontWeight: 900,
      }}
    >
      M
    </div>,
    // ImageResponse options
    {
      ...size,
    },
  )
}
