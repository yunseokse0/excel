"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Radio, Users } from "lucide-react";
import { cn } from "../lib/utils";
import { useLiveRanking } from "../hooks/use-live-ranking";

const navItems = [
  { href: "/", label: "라이브", icon: Radio },
  { href: "/ranking", label: "랭킹", icon: Crown },
  { href: "/live", label: "커뮤니티", icon: Users },
];

export function Header() {
  const pathname = usePathname();
  const { ranking, loading } = useLiveRanking();
  const top1 = ranking[0];

  return (
    <header className="border-b border-zinc-800/60 bg-gradient-to-b from-black/80 via-zinc-950/80 to-black/40 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4 gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 shadow-[0_0_25px_rgba(234,179,8,0.45)]">
            <span className="text-xs font-black tracking-tight text-black">
              EX
            </span>
            <span className="absolute inset-[3px] rounded-lg border border-yellow-200/40" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-wide text-zinc-50">
              Excel Live Arena
            </span>
            <span className="text-[11px] text-zinc-400 group-hover:text-zinc-300 transition-colors">
              실시간 엑셀 방송 팬 페이지
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 rounded-full bg-zinc-900/80 px-1 py-1 border border-zinc-800/70 shadow-[0_0_25px_rgba(0,0,0,0.65)]">
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

        <div className="flex items-center gap-3">
          <Link
            href="/ranking"
            className="hidden md:flex items-center gap-1.5 rounded-full border border-amber-500/60 bg-zinc-950/80 px-3 py-1.5 text-[11px] text-amber-100 shadow-[0_0_18px_rgba(250,204,21,0.35)] hover:bg-zinc-900/90 transition"
          >
            <Crown className="h-3.5 w-3.5 text-amber-300" />
            {loading || !top1 ? (
              <span className="text-zinc-500">1위 랭킹 불러오는 중...</span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="font-semibold">현재 1위</span>
                <span className="text-amber-300">{top1.bj.name}</span>
                <span className="text-[10px] text-amber-200/80">
                  {top1.points.toLocaleString()} pts
                </span>
              </span>
            )}
          </Link>

          <button className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/60 bg-gradient-to-r from-yellow-500/90 via-amber-500/90 to-yellow-400/90 px-4 py-1.5 text-xs font-semibold text-black shadow-[0_0_22px_rgba(250,204,21,0.55)] transition hover:brightness-110">
            <span>로그인</span>
          </button>
        </div>
      </div>
    </header>
  );
}

