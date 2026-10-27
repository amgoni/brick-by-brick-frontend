import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeSync } from "@/components/theme/theme-sync";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { Providers } from "./providers";
import "./globals.css";

// Interface type. Variable font, so every weight comes from one file.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Codes, references and figures: INV-2026-0149, EQ-004.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Brick By Brick",
    template: "%s · Brick By Brick",
  },
  description:
    "Construction management for builders and developers: projects and sites, stock, equipment, people and money in one place.",
};

/**
 * Browser chrome follows the app's own surface in each theme. Pinch-zoom stays
 * on (no `maximumScale`): blocking it fails WCAG 1.4.4, and site photos and
 * drawings need it.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1324" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      // The inline script sets data-theme before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <Providers>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </Providers>
        <Toaster />
        <ThemeSync />
      </body>
    </html>
  );
}
