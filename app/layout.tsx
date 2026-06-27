import type { Metadata, Viewport } from "next";
import "./globals.css";

const OG_TITLE = "MatchTurn ⚽ — Organizá tu turno de fútbol";
const OG_DESC =
  "Sacá el turno fijo y que cada uno confirme desde el celu. Los primeros juegan; el resto, suplentes.";

export const metadata: Metadata = {
  metadataBase: new URL("https://matchturn.click"),
  title: OG_TITLE,
  description: OG_DESC,
  openGraph: {
    title: OG_TITLE,
    description: OG_DESC,
    url: "/",
    siteName: "MatchTurn",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESC,
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
