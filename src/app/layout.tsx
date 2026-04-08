import type { Metadata } from "next";
import localFont from "next/font/local";
import { Lora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/providers/query-provider";
import { PostHogProvider } from "@/providers/posthog-provider";
import { Nav } from "@/components/layout/nav";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Signal",
  description:
    "Cut through the noise — curated articles, videos, and insights worth your time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(geistSans.variable, geistMono.variable, lora.variable)}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <PostHogProvider>
          <QueryProvider>
            <Nav />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
            <Toaster />
          </QueryProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
