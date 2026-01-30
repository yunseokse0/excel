"use client";

import { useState } from "react";
import type { RankingEntry } from "../../types/bj";
import { useLiveRanking } from "../../hooks/use-live-ranking";
import { PlatformBadge } from "../platform-badge";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useToast } from "../ui/toast-context";
import { YouTubeSyncButton } from "./youtube-sync-button";
import { SoopSyncButton } from "./soop-sync-button";

interface RankingEditTableProps {
  initialRanking?: RankingEntry[];
}

export function RankingEditTable({ initialRanking }: RankingEditTableProps) {
  const { ranking: liveRanking, loading } = useLiveRanking();
  const ranking = liveRanking.length ? liveRanking : (initialRanking ?? []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
              실시간 시청자 랭킹
            </h1>
            <p className="text-sm text-zinc-400">
              YouTube와 SOOP 플랫폼의 실시간 시청자수 기준 랭킹입니다. 30초마다 자동으로 갱신됩니다.
            </p>
        </div>
        <div className="flex items-center gap-2">
          <YouTubeSyncButton />
          <SoopSyncButton />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/80">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/90 border-b border-zinc-800/80">
            <tr className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              <th className="px-4 py-3 text-left">순위</th>
              <th className="px-4 py-3 text-left">BJ 닉네임</th>
              <th className="px-4 py-3 text-left">플랫폼</th>
              <th className="px-4 py-3 text-right">실시간 시청자</th>
              <th className="px-4 py-3 text-right">어제 대비</th>
            </tr>
          </thead>
          <tbody>
            {loading && !ranking.length && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-xs text-zinc-500"
                >
                  랭킹 데이터를 불러오는 중입니다...
                </td>
              </tr>
            )}
            {ranking.map((entry) => (
              <tr
                key={entry.bj.id}
                className="border-t border-zinc-800/70 text-xs text-zinc-200"
              >
                <td className="px-4 py-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-amber-300 border border-amber-500/50">
                    {entry.rank}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <p className="font-medium">{entry.bj.name}</p>
                </td>
                <td className="px-4 py-2.5">
                  <PlatformBadge platform={entry.bj.platform} size="xs" />
                </td>
                <td className="px-4 py-2.5 text-right text-amber-300/90">
                  {entry.viewerCount.toLocaleString()}명
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-2 py-1">
                    {entry.diffFromYesterday > 0 && (
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    {entry.diffFromYesterday < 0 && (
                      <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                    )}
                    {entry.diffFromYesterday === 0 && (
                      <Minus className="h-3.5 w-3.5 text-zinc-500" />
                    )}
                    <span className="text-[11px] text-zinc-300">
                      {entry.diffFromYesterday > 0 && `+${entry.diffFromYesterday}위`}
                      {entry.diffFromYesterday < 0 && `${entry.diffFromYesterday}위`}
                      {entry.diffFromYesterday === 0 && "변동 없음"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

