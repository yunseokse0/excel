"use client";

import { useEffect, useState } from "react";
import type { RankingEntry } from "../types/bj";
import { useLiveRankingStore } from "../store/live-ranking";

export function useLiveRanking() {
  const { ranking, loading, setRanking, setLoading } = useLiveRankingStore();
  const [lastUpdate, setLastUpdate] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    async function load() {
      try {
        // 랭킹이 이미 로드되어 있고 최근에 업데이트되었다면 스킵
        const currentRanking = useLiveRankingStore.getState().ranking;
        if (currentRanking.length > 0 && Date.now() - lastUpdate < 5000) {
          console.log(`[useLiveRanking] ⏭️ Skipping - ranking already loaded recently`);
          return;
        }

        setLoading(true);
        const timestamp = Date.now();
        const res = await fetch(`/api/live-ranking?t=${timestamp}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (cancelled) return;

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[useLiveRanking] API error: ${res.status}`, errorText);
          setRanking([], false);
          return;
        }

        const data = await res.json();

        if (data.success && data.ranking) {
          setRanking(data.ranking, false);
          setLastUpdate(Date.now());
          console.log(`[useLiveRanking] ✅ Loaded ${data.ranking.length} ranking entries`);
        } else {
          console.error("[useLiveRanking] Failed to load live ranking:", data.error);
          setRanking([], false);
        }
      } catch (e) {
        console.error("[useLiveRanking] Error loading live ranking:", e);
        if (!cancelled) {
          setRanking([], false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    // 초기 로드 (약간의 지연을 두어 live-list API가 먼저 실행되도록)
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        void load();
      }
    }, 500);

    // 30초마다 자동 갱신 (live-list와 동기화)
    intervalId = setInterval(() => {
      if (!cancelled) {
        console.log("[useLiveRanking] Polling for ranking updates...");
        void load();
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [setRanking, setLoading, lastUpdate]);

  return { ranking, loading, usingMock: false };
}
