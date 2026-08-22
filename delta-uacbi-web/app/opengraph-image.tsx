import { ImageResponse } from "next/og";

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
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(circle at 15% 15%, rgba(255,255,255,0.12) 0%, transparent 45%), linear-gradient(135deg, #0a757c 0%, #442776 65%, #c02364 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "rgba(255,255,255,0.16)",
            fontSize: 56,
            fontWeight: 700,
            color: "#fdfdfd",
            fontFamily: "sans-serif",
          }}
        >
          D
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 72,
            fontWeight: 700,
            color: "#fdfdfd",
            fontFamily: "sans-serif",
          }}
        >
          Delta UACBI
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 32,
            color: "rgba(253,253,253,0.85)",
            fontFamily: "sans-serif",
          }}
        >
          Comité académico · UACBI
        </div>
      </div>
    ),
    { ...size }
  );
}
