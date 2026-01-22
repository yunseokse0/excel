"use client";

import { useState } from "react";
import type { RankingEntry } from "../../types/bj";
import { useLiveRanking } from "../../hooks/use-live-ranking";
import { updateBJScore, bulkIncrementAllScores } from "../../lib/actions/admin";
import { useToast } from "../ui/toast-context";

interface RankingEditTableProps {
  initialRanking?: RankingEntry[];
}

export function RankingEditTable({ initialRanking }: RankingEditTableProps) {
  const { ranking: liveRanking, loading } = useLiveRanking();
  const [localRanking, setLocalRanking] = useState<RankingEntry[]>(
    initialRanking ?? liveRanking
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const { showToast } = useToast();

  const ranking = liveRanking.length ? liveRanking : localRanking;

  const handleScoreChange = (bjId: string, value: number) => {
    setLocalRanking((prev) =>
      prev.map((entry) =>
        entry.bj.id === bjId ? { ...entry, points: value } : entry
      )
    );
  };

  const handleScoreCommit = async (bjId: string, newScore: number) => {
    setSavingId(bjId);
    const result = await updateBJScore(bjId, newScore);
    setSavingId(null);

    if (!result.success) {
      setLocalRanking(liveRanking);
      showToast({
        title: "점수 업데이트 실패",
        description: result.error ?? "점수 업데이트에 실패했습니다.",
        variant: "error",
      });
    } else {
      showToast({
        title: "점수가 저장되었습니다.",
        variant: "success",
      });
    }
  };

  const handleBulkIncrement = async (delta: number) => {
    setBulkLoading(true);
    const before = [...ranking];
    setLocalRanking((prev) =>
      prev.map((entry) => ({
        ...entry,
        points: entry.points + delta,
      }))
    );

    const result = await bulkIncrementAllScores(delta);
    setBulkLoading(false);

    if (!result.success) {
      setLocalRanking(before);
      showToast({
        title: "일괄 업데이트 실패",
        description: result.error ?? "일괄 업데이트에 실패했습니다.",
        variant: "error",
      });
    } else {
      showToast({
        title: "모든 BJ 점수가 +1,000 되었습니다.",
        variant: "success",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            관리자 랭킹 편집
          </h1>
          <p className="text-sm text-zinc-400">
            셀을 직접 수정해 점수와 순위를 빠르게 조정하세요. Enter 또는 포커스
            아웃 시 저장됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => handleBulkIncrement(1000)}
            className="rounded-full border border-amber-500/70 bg-amber-500/20 px-4 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 disabled:opacity-60"
          >
            모든 BJ 점수 +1,000
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/80">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/90 border-b border-zinc-800/80">
            <tr className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              <th className="px-4 py-3 text-left">순위</th>
              <th className="px-4 py-3 text-left">BJ 닉네임</th>
              <th className="px-4 py-3 text-right">현재 포인트</th>
            </tr>
          </thead>
          <tbody>
            {loading && !ranking.length && (
              <tr>
                <td
                  colSpan={3}
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
                <td className="px-4 py-2.5 text-right">
                  <input
                    type="number"
                    className="w-28 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-right text-xs text-zinc-50 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/60"
                    value={entry.points}
                    onChange={(e) =>
                      handleScoreChange(entry.bj.id, Number(e.target.value))
                    }
                    onBlur={() =>
                      handleScoreCommit(entry.bj.id, entry.points)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void handleScoreCommit(entry.bj.id, entry.points);
                      }
                    }}
                  />
                  {savingId === entry.bj.id && (
                    <span className="ml-2 text-[10px] text-zinc-500">
                      저장 중...
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

