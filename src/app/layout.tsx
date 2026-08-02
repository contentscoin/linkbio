import type { Metadata } from "next";
import { Fraunces, Manrope, Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sport",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-night",
});

export const metadata: Metadata = {
  title: "LinkBio",
  description: "Editorial link-in-bio pages with templates, social import, and agent MCP control.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${manrope.variable} ${fraunces.variable} ${outfit.variable} ${space.variable}`}>
        {children}
      </body>
    </html>
  );
}
