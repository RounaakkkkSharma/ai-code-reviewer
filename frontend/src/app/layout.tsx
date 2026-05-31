import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReviewAI — Your Senior Engineer, Available 24/7",
  description:
    "AI-powered code review using parallel specialist agents. Detects bugs, security vulnerabilities, performance issues, and style problems in seconds.",
  keywords: ["code review", "AI", "security", "bugs", "performance", "LLM"],
  openGraph: {
    title: "ReviewAI — Your Senior Engineer, Available 24/7",
    description: "Multi-agent AI code reviewer powered by LangGraph",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
