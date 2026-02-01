"use client";

import { useLiveRanking } from "../hooks/use-live-ranking";
import { RankingTable } from "./ranking-table";
import { Podium } from "./ranking-podium";
import { Skeleton } from "./ui/skeleton";

export function LiveRankingBoard() {
  const { ranking, loading, usingMock } = useLiveRanking();
  const top3 = ranking.slice(0, 3);

  const showSkeleton = loading && !ranking.length;

  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <section className="space-y-4 order-2 lg:order-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-50">
              실시간 시청자 랭킹
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              YouTube 플랫폼의 실시간 시청자수 기준 랭킹입니다.
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            {loading && (
              <span className="text-[11px] text-zinc-500">불러오는 중...</span>
            )}
            {usingMock && !loading && (
              <span className="rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1 text-[10px] font-medium text-zinc-400">
                Supabase 미설정 · 예시 데이터 사용 중
              </span>
            )}
            {!usingMock && !loading && (
              <span className="rounded-full border border-emerald-500/60 bg-emerald-900/30 px-3 py-1 text-[10px] font-medium text-emerald-200">
                Supabase 연결됨 · 실시간 랭킹
              </span>
            )}
          </div>
        </div>

        {showSkeleton ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <RankingTable ranking={ranking} />
        )}
      </section>

      <aside className="space-y-4 order-1 lg:order-2">
        <h2 className="text-sm font-semibold text-zinc-200">실시간 시청자 TOP 3</h2>
        {showSkeleton ? (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <Podium ranking={top3} />
        )}
      </aside>
    </div>
  );
}

