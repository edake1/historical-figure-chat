import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Historical Figure Group Chat — AI-Powered Conversations Through Time",
  description: "What if Einstein, Cleopatra, and Shakespeare were in a group chat? Select historical figures, choose a topic, and watch them debate in real-time with distinct personalities.",
  keywords: ["historical figures", "AI chat", "group chat", "history", "education", "Einstein", "Cleopatra", "Shakespeare"],
  openGraph: {
    title: "Historical Figure Group Chat",
    description: "AI-powered conversations between history's greatest minds",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Historical Figure Group Chat",
    description: "AI-powered conversations between history's greatest minds",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
