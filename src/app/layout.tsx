import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "../components/header";
import { ToastProvider } from "../components/ui/toast-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Real-time Excel 방송 팬페이지",
  description: "실시간 엑셀방송 BJ 랭킹과 라이브를 한눈에.",
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
          <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-zinc-950 to-black">
            <Header />
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 lg:py-10">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
