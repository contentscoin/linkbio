import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkBio",
  description: "A small, secure link-in-bio app for creators and operators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
