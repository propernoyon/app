import { Geist, Geist_Mono } from "next/font/google";

/**
 * Fonts are declared once and shared by every root layout (`app/[locale]` and
 * the dev-only `app/dev`). `display: "swap"` keeps text visible during load and
 * `next/font` self-hosts the files, so there is no third-party request at runtime.
 */
export const fontSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const fontVariables = `${fontSans.variable} ${fontMono.variable}`;
