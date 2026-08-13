import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ReduxProvider } from "@/lib/redux/ReduxProvider";
import { siteDescription, siteName, siteUrl } from "@/lib/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Taskly Admin — Task Management Dashboard",
    template: "%s · Taskly Admin",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "task management",
    "project management",
    "team dashboard",
    "employee management",
    "Taskly",
  ],
  authors: [{ name: "Taskly" }],
  creator: "Taskly",
  publisher: "Taskly",
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false, address: false, email: false },
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    siteName,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <ReduxProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ReduxProvider>
      </body>
    </html>
  );
}
