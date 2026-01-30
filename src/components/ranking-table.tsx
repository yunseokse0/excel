import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { RankingEntry } from "../types/bj";
import { PlatformBadge } from "./platform-badge";

interface RankingTableProps {
  ranking: RankingEntry[];
}

export function RankingTable({ ranking }: RankingTableProps) {
  return (
    <>
      {/* 데스크톱 테이블 */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/80 shadow-[0_28px_80px_rgba(0,0,0,0.9)]">
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
            {ranking.map((entry) => {
              const trend =
                entry.diffFromYesterday > 0
                  ? "up"
                  : entry.diffFromYesterday < 0
                  ? "down"
                  : "same";

              return (
                <tr
                  key={entry.bj.id}
                  className="border-t border-zinc-800/70 text-xs text-zinc-200 hover:bg-zinc-900/60"
                >
                  <td className="px-4 py-2.5">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-amber-300 border border-amber-500/50">
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="font-medium">{entry.bj.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {entry.bj.channelUrl}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <PlatformBadge platform={entry.bj.platform} />
                  </td>
                  <td className="px-4 py-2.5 text-right text-amber-300/90">
                    {entry.viewerCount.toLocaleString()}명
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-2 py-1">
                      {trend === "up" && (
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                      {trend === "down" && (
                        <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                      )}
                      {trend === "same" && (
                        <Minus className="h-3.5 w-3.5 text-zinc-500" />
                      )}
                      <span className="text-[11px] text-zinc-300">
                        {trend === "up" && `+${entry.diffFromYesterday}위`}
                        {trend === "down" && `${entry.diffFromYesterday}위`}
                        {trend === "same" && "변동 없음"}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 리스트 */}
      <div className="md:hidden space-y-3">
        {ranking.map((entry) => {
          const trend =
            entry.diffFromYesterday > 0
              ? "up"
              : entry.diffFromYesterday < 0
              ? "down"
              : "same";

          return (
            <div
              key={entry.bj.id}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-amber-300 border border-amber-500/50">
                    {entry.rank}
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-zinc-50">
                      {entry.bj.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <PlatformBadge platform={entry.bj.platform} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-2.5 py-1.5">
                  {trend === "up" && (
                    <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                  )}
                  {trend === "down" && (
                    <ArrowDownRight className="h-4 w-4 text-red-400" />
                  )}
                  {trend === "same" && (
                    <Minus className="h-4 w-4 text-zinc-500" />
                  )}
                  <span className="text-xs text-zinc-300">
                    {trend === "up" && `+${entry.diffFromYesterday}위`}
                    {trend === "down" && `${entry.diffFromYesterday}위`}
                    {trend === "same" && "변동 없음"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/70">
                <span className="text-xs text-zinc-400">실시간 시청자</span>
                <span className="text-sm font-semibold text-amber-300/90">
                  {entry.viewerCount.toLocaleString()}명
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

