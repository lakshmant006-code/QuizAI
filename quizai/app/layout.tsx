import type { Metadata, Viewport } from "next";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuizAI — study smarter, remember longer",
  description:
    "Upload notes, PDFs, or links — QuizAI generates quizzes, flashcards, and summaries, then tracks what your brain actually retains.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8C1D40",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
