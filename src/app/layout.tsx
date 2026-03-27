import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "trii — Cycle Tracker",
  description: "trii product cycle tracking dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
