import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "../components/header";
import { ToastProvider } from "../components/ui/toast-context";
import { LiveNotificationsProvider } from "../components/live-notifications-provider";
import { TopBanner } from "../components/ads/top-banner";
import { PopupAd } from "../components/ads/popup-ad";
import { BottomBanner } from "../components/ads/bottom-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "실시간 방송 리스트",
  description: "YouTube 실시간 방송을 한눈에. 실시간 시청자수 기준 랭킹과 라이브 스트리밍.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ToastProvider>
          <LiveNotificationsProvider />
          <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-zinc-950 to-black">
            <TopBanner />
            <Header />
            <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-10">
              {children}
            </main>
            <BottomBanner />
            <PopupAd />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
