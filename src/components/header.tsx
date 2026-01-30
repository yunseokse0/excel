"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Crown, Radio, Users, Menu, X, Video } from "lucide-react";
import { cn } from "../lib/utils";
import { useLiveRanking } from "../hooks/use-live-ranking";

const navItems = [
  { href: "/", label: "라이브", icon: Radio },
  { href: "/ranking", label: "랭킹", icon: Crown },
  { href: "/live", label: "커뮤니티", icon: Users },
  { href: "/live-list", label: "방송 목록", icon: Radio },
];

export function Header() {
  const pathname = usePathname();
  const { ranking, loading } = useLiveRanking();
  const top1 = ranking[0];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-zinc-800/60 bg-gradient-to-b from-black/80 via-zinc-950/80 to-black/40 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 gap-2 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
          <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 shadow-[0_0_25px_rgba(234,179,8,0.45)]">
            <Video className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
            <span className="absolute inset-[3px] rounded-lg border border-yellow-200/40" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-50">
              실시간 방송 리스트
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 group-hover:text-zinc-300 transition-colors">
              YouTube와 SOOP 실시간 방송 모음
            </span>
          </div>
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-zinc-900/80 px-1 py-1 border border-zinc-800/70 shadow-[0_0_25px_rgba(0,0,0,0.65)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all",
                  "text-zinc-400 hover:text-zinc-100",
                  active &&
                    "bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-black shadow-[0_0_18px_rgba(250,204,21,0.55)]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 모바일 메뉴 버튼 */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 transition"
          aria-label="메뉴"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* 데스크톱 우측 메뉴 */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/ranking"
            className="flex items-center gap-1.5 rounded-full border border-amber-500/60 bg-zinc-950/80 px-3 py-1.5 text-[11px] text-amber-100 shadow-[0_0_18px_rgba(250,204,21,0.35)] hover:bg-zinc-900/90 transition"
          >
            <Crown className="h-3.5 w-3.5 text-amber-300" />
            {loading || !top1 ? (
              <span className="text-zinc-500">1위 랭킹 불러오는 중...</span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="font-semibold">현재 1위</span>
                <span className="text-amber-300">{top1.bj.name}</span>
                <span className="text-[10px] text-amber-200/80">
                  {top1.viewerCount.toLocaleString()}명
                </span>
              </span>
            )}
          </Link>

          <button className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/60 bg-gradient-to-r from-yellow-500/90 via-amber-500/90 to-yellow-400/90 px-4 py-1.5 text-xs font-semibold text-black shadow-[0_0_22px_rgba(250,204,21,0.55)] transition hover:brightness-110">
            <span>로그인</span>
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800/60 bg-zinc-950/95 backdrop-blur-md">
          <nav className="max-w-6xl mx-auto px-4 py-3 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50",
                    active &&
                      "bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 text-amber-200 border border-amber-500/30"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {top1 && (
              <Link
                href="/ranking"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-amber-200 bg-amber-500/10 border border-amber-500/30"
              >
                <Crown className="h-5 w-5 text-amber-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-amber-300/80">현재 1위</span>
                  <span className="font-semibold">{top1.bj.name}</span>
                </div>
              </Link>
            )}
            <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-yellow-400/60 bg-gradient-to-r from-yellow-500/90 via-amber-500/90 to-yellow-400/90 px-4 py-3 text-sm font-semibold text-black shadow-[0_0_22px_rgba(250,204,21,0.55)]">
              <span>로그인</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

