import type { Metadata, Viewport } from "next";
import { Poppins, Playfair_Display, Figtree } from "next/font/google";
import "@phosphor-icons/web/regular";
import "./globals.css";
import { Analytics } from "@/components/Analytics";

// Modern geometric sans for app headings + buttons.
const display = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Editorial serif for the landing display type.
const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// Body/UI sans used across the editorial landing.
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
  display: "swap",
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://quizai.help";
const TITLE = "QuizAI — Free AI Quiz Generator from any PDF";
const DESCRIPTION =
  "QuizAI is a free AI quiz generator that turns any PDF, notes, or readings into quizzes, flashcards, and summaries in seconds. Make a practice quiz online, study smarter, and remember more — no sign-up cost.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
    template: "%s · QuizAI",
  },
  description: DESCRIPTION,
  applicationName: "QuizAI",
  keywords: [
    "quiz AI", "AI quiz", "AI quiz generator", "quiz generator", "quiz maker",
    "PDF to quiz", "make a quiz online", "flashcards", "study app", "summaries",
    "AI study tool", "practice questions", "test prep", "exam revision",
    "free quiz maker", "study companion", "generate quiz from PDF",
  ],
  authors: [{ name: "QuizAI" }],
  creator: "QuizAI",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "QuizAI",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: { icon: "/icon.svg" },
  category: "education",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#8C1D40",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${figtree.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
