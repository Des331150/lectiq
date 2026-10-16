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

/**
 * Without metadataBase, Next cannot resolve the relative paths in openGraph and
 * twitter into absolute URLs, so a shared link renders with no preview image.
 * Overridable so a preview deploy does not advertise the production origin.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lectiq-lac.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Lectiq - Study Smarter",
  description:
    "Turn your lecture notes into quizzes that test understanding, not just recognition.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Lectiq",
    title: "Lectiq - Know why you got it wrong",
    description:
      "Upload a lecture PDF or PowerPoint, take a quiz, and get each wrong answer explained against the line of your own document that settles it.",
    images: [
      {
        // Matches the hero, so a shared link shows the same screen the visitor
        // would have landed on. The file is 1984x702; declaring its real
        // dimensions is what tells Slack and LinkedIn how to crop it.
        url: "/results-tile-stacked.png",
        width: 992,
        height: 351,
        alt: "A wrong answer, the correct one, and an explanation of why",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lectiq - Know why you got it wrong",
    description:
      "Upload a lecture PDF or PowerPoint, take a quiz, and get each wrong answer explained against the line of your own document that settles it.",
    images: ["/results-tile-stacked.png"],
  },
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
