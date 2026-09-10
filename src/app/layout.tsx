import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeScript } from "@/components/theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // A template rather than a fixed string, so every page gets its own title in
  // the tab and in a shared link without repeating the suffix by hand.
  title: {
    default: "Community App",
    template: "%s — Community App",
  },
  description:
    "Report local problems and follow what happens next. A civic reporting and accountability platform.",
  openGraph: {
    title: "Community App",
    description:
      "Report a problem in your area and see exactly what happens next. Every report gets a public, append-only timeline.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The theme is set on this element by ThemeScript before the first paint.
      // React will not have rendered an attribute here, and it must not remove
      // the one the script added when it hydrates.
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        {/*
          A keyboard user landing here otherwise has to tab through the whole
          header on every page before reaching the content. The link is hidden
          until focused, which is the point: invisible to a mouse, first stop
          for a keyboard.
        */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-paper"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div id="main" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
