"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { RankingEntry } from "../types/bj";
import { PlatformBadge } from "./platform-badge";
import { useLiveRanking } from "../hooks/use-live-ranking";
import { UniversalPlayerTrigger } from "./universal-player";

interface MiniRankingBoardProps {
  ranking?: RankingEntry[]; // Optional for backward compatibility
}

export function MiniRankingBoard({ ranking: propRanking }: MiniRankingBoardProps) {
  // Use hook to get real-time ranking if not provided as prop
  const { ranking: hookRanking, loading } = useLiveRanking();
  const ranking = propRanking || hookRanking.slice(0, 5);
  
  if (loading && ranking.length === 0) {
    return (
      <section className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black px-4 py-4 shadow-[0_28px_80px_rgba(0,0,0,0.9)]">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-zinc-50">
              실시간 시청자 TOP 5
            </h2>
            <p className="text-[11px] text-zinc-400">실시간 시청자수 랭킹 요약</p>
          </div>
          <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-[10px] font-semibold text-yellow-300 border border-yellow-400/60">
            LIVE RANK
          </span>
        </header>
        <div className="py-4 text-center">
          <p className="text-xs text-zinc-500">랭킹을 불러오는 중...</p>
        </div>
      </section>
    );
  }
  
  if (ranking.length === 0) {
    return (
      <section className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black px-4 py-4 shadow-[0_28px_80px_rgba(0,0,0,0.9)]">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-zinc-50">
              실시간 시청자 TOP 5
            </h2>
            <p className="text-[11px] text-zinc-400">실시간 시청자수 랭킹 요약</p>
          </div>
          <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-[10px] font-semibold text-yellow-300 border border-yellow-400/60">
            LIVE RANK
          </span>
        </header>
        <div className="py-4 text-center">
          <p className="text-xs text-zinc-500">현재 방송 중인 BJ가 없습니다.</p>
        </div>
      </section>
    );
  }
  
  return (
    <section className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black px-4 py-4 shadow-[0_28px_80px_rgba(0,0,0,0.9)]">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-zinc-50">
            실시간 시청자 TOP 5
          </h2>
          <p className="text-[11px] text-zinc-400">실시간 시청자수 랭킹 요약</p>
        </div>
        <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-[10px] font-semibold text-yellow-300 border border-yellow-400/60">
          LIVE RANK
        </span>
      </header>

      <ul className="space-y-1.5">
        {ranking.map((entry) => {
          const trend =
            entry.diffFromYesterday > 0
              ? "up"
              : entry.diffFromYesterday < 0
              ? "down"
              : "same";

          return (
            <UniversalPlayerTrigger
              key={entry.bj.id}
              bj={entry.bj}
              title={`${entry.bj.name}의 방송`}
            >
              <li className="flex items-center justify-between rounded-2xl bg-zinc-950/80 px-2.5 py-2 text-xs text-zinc-200 cursor-pointer hover:bg-zinc-900/80 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-amber-300 border border-amber-500/50">
                    {entry.rank}
                  </span>
                  <div>
                    <p className="max-w-[130px] truncate font-medium">
                      {entry.bj.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="text-[10px] text-zinc-500">
                        {entry.viewerCount.toLocaleString()}명
                      </span>
                      <PlatformBadge platform={entry.bj.platform} size="xs" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {trend === "up" && (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  {trend === "down" && (
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                  )}
                  {trend === "same" && (
                    <Minus className="h-3.5 w-3.5 text-zinc-500" />
                  )}
                  <span className="text-[10px] text-zinc-400">
                    {trend === "up" && `+${entry.diffFromYesterday}위`}
                    {trend === "down" && `${entry.diffFromYesterday}위`}
                    {trend === "same" && "변동 없음"}
                  </span>
                </div>
              </li>
            </UniversalPlayerTrigger>
          );
        })}
      </ul>
    </section>
  );
}

