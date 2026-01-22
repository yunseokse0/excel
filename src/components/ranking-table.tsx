import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { RankingEntry } from "../types/bj";
import { PlatformBadge } from "./platform-badge";

interface RankingTableProps {
  ranking: RankingEntry[];
}

export function RankingTable({ ranking }: RankingTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/80 shadow-[0_28px_80px_rgba(0,0,0,0.9)]">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-900/90 border-b border-zinc-800/80">
          <tr className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            <th className="px-4 py-3 text-left">순위</th>
            <th className="px-4 py-3 text-left">BJ 닉네임</th>
            <th className="px-4 py-3 text-left">플랫폼</th>
            <th className="px-4 py-3 text-right">현재 포인트</th>
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
                  {entry.points.toLocaleString()} pts
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
  );
}

