import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI 공유계정 관리",
  description: "AI 공유계정 예약 및 사용 관리 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>{children}</body>
    </html>
  );
}
