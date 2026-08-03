import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

// Modern geometric sans for landing headings + buttons (matches the reference).
const display = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://quizai.help";
const TITLE = "QuizAI — Turn any PDF into quizzes, flashcards & summaries";
const DESCRIPTION =
  "QuizAI turns your notes, PDFs, and readings into quizzes, flashcards, and summaries — instantly and free. Study smarter, test what you actually remember, and track your progress.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
    template: "%s · QuizAI",
  },
  description: DESCRIPTION,
  applicationName: "QuizAI",
  keywords: [
    "quiz generator", "PDF to quiz", "flashcards", "study app", "summaries",
    "AI study tool", "practice questions", "test prep", "exam revision",
    "free quiz maker", "study companion",
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
    <html lang="en" className={display.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
