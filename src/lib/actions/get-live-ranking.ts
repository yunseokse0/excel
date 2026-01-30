"use server";

import { getCurrentLiveList } from "./get-live-list";
import type { RankingEntry } from "../../types/bj";

/**
 * 실시간 시청자수 기반 랭킹을 가져옵니다.
 * YouTube와 SOOP 플랫폼의 라이브 방송을 시청자수 순으로 정렬합니다.
 */
export async function getLiveRankingByViewers(): Promise<{
  success: boolean;
  error?: string;
  ranking: RankingEntry[];
}> {
  try {
    const result = await getCurrentLiveList();

    if (!result.success || !result.liveList) {
      return {
        success: false,
        error: result.error || "Failed to fetch live list",
        ranking: [],
      };
    }

    // 시청자수 기준으로 정렬 (높은 순)
    const sorted = [...result.liveList].sort((a, b) => {
      const aViewers = a.viewerCount || 0;
      const bViewers = b.viewerCount || 0;
      return bViewers - aViewers;
    });

    // 랭킹 번호 할당 (같은 시청자수는 같은 순위)
    const ranking: RankingEntry[] = [];
    let currentRank = 1;
    let previousViewers: number | undefined = undefined;

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      const viewers = item.viewerCount || 0;

      // 시청자수가 0이면 제외
      if (viewers === 0) {
        continue;
      }

      // 이전 항목과 시청자수가 다르면 순위 증가
      if (previousViewers !== undefined && viewers !== previousViewers) {
        currentRank = ranking.length + 1;
      }

      ranking.push({
        rank: currentRank,
        bj: item.bj,
        viewerCount: viewers,
        diffFromYesterday: 0, // TODO: 어제 데이터와 비교하여 계산
      });

      previousViewers = viewers;
    }

    console.log(`[Ranking] ✅ Generated ranking for ${ranking.length} live streams (by viewer count)`);

    return {
      success: true,
      ranking,
    };
  } catch (error) {
    console.error("[Ranking] ❌ Failed to get live ranking:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      ranking: [],
    };
  }
}
