import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://matchturn.click"),
  title: "MatchTurn ⚽ — Turno fijo de fútbol",
  description:
    "Confirmá tu lugar para el fútbol. Los primeros quedan convocados; el resto, suplentes. Armá tu turno fijo gratis.",
  openGraph: {
    title: "MatchTurn ⚽ — Turno fijo de fútbol",
    description:
      "Confirmá tu lugar para el fútbol. Los primeros quedan convocados; el resto, suplentes.",
    url: "/",
    siteName: "MatchTurn",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MatchTurn ⚽ — Turno fijo de fútbol",
    description:
      "Confirmá tu lugar para el fútbol. Armá tu turno fijo gratis.",
  },
};

export const viewport: Viewport = {
  themeColor: "#064e3b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
