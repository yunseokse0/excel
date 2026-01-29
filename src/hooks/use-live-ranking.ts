"use client";

import { useEffect } from "react";
import type { BJ } from "../types/bj";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import { useLiveRankingStore } from "../store/live-ranking";

interface LiveRankingRow {
  rank: number;
  current_score: number;
  diff_from_yesterday: number;
  bj_id: string;
  name: string;
  platform: "youtube" | "soop" | "panda";
  thumbnail_url: string;
  channel_url: string;
}

export function useLiveRanking() {
  const { ranking, loading, usingMock, setRanking, setLoading } =
    useLiveRankingStore();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Frontend 기반 모드: Supabase가 없으면 mock 데이터 사용
        if (!supabase) {
          console.warn("Supabase not configured, using mock ranking.");
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("live_ranking_view")
          .select("*")
          .order("rank", { ascending: true });

        if (error) {
          console.error("Failed to load live ranking from Supabase", error);
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

        if (!data || cancelled) return;

        const mapped = mapRowsToRankingEntries(data as LiveRankingRow[]);
        setRanking(mapped, false);

        // 실시간 구독: bj_stats 테이블이 변경되면 다시 조회
        const channel = supabase
          .channel("bj-stats-realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "bj_stats",
            },
            async () => {
              const { data: updated } = await supabase
                .from("live_ranking_view")
                .select("*")
                .order("rank", { ascending: true });

              if (!updated || cancelled) return;
              setRanking(
                mapRowsToRankingEntries(updated as LiveRankingRow[]),
                false
              );
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (e) {
        // env 미설정 등: mock 데이터 그대로 사용
        console.warn("Supabase not configured, using mock ranking.", e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const cleanupPromise = load();

    return () => {
      cancelled = true;
      // load() 내부에서 생성한 채널 정리는 내부에서 처리
      void cleanupPromise;
    };
  }, []);

  return { ranking, loading, usingMock };
}

function mapRowsToRankingEntries(rows: LiveRankingRow[]) {
  return rows.map((row) => {
    const bj: BJ = {
      id: row.bj_id,
      name: row.name,
      platform: row.platform,
      isLive: true,
      currentScore: row.current_score,
      thumbnailUrl: row.thumbnail_url,
      channelUrl: row.channel_url,
    };

    return {
      rank: row.rank,
      bj,
      points: row.current_score,
      diffFromYesterday: row.diff_from_yesterday,
    };
  });
}
