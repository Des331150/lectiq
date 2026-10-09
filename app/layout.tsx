import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * DESIGN.md names Inter as the primary face. It was never actually loaded:
 * the body carried Tailwind's stock `font-sans`, so every page rendered in
 * whatever the host OS resolved to. Next.js injects its own Geist faces, but
 * nothing referenced them either - they were downloaded and unused.
 * Setting the variable here makes the stack deterministic in dev and production.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lectiq - Study Smarter",
  description: "Turn your lecture notes into quizzes",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
