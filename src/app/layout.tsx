import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OMO Bio — 프로필 링크 하나로 전부 모으기",
  description:
    "SNS 프로필에 링크를 하나만 걸 수 있을 때, 그 하나에 필요한 걸 다 모아두는 페이지를 만듭니다.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Serif+KR:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
