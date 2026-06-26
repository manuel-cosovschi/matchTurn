import { ImageResponse } from "next/og";

export const alt = "MatchTurn — Turno fijo de fútbol";
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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#070b14",
          backgroundImage:
            "radial-gradient(900px 500px at 50% 0%, #064e3b 0%, #0b1220 55%, #070b14 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 120, display: "flex" }}>⚽</div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: -2,
            display: "flex",
          }}
        >
          MatchTurn
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 40,
            color: "#6ee7b7",
            display: "flex",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          Confirmá tu lugar para el fútbol
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 30,
            color: "#cbd5e1",
            display: "flex",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          Los primeros quedan convocados · el resto, suplentes
        </div>
      </div>
    ),
    { ...size }
  );
}
