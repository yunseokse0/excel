"use client";

import { useEffect, useState } from "react";
import { HeroCarousel } from "../components/hero-carousel";
import { LiveGrid } from "../components/live-grid";
import { MiniRankingBoard } from "../components/mini-ranking-board";
import type { LiveEntry } from "../types/bj";
import { Skeleton } from "../components/ui/skeleton";

export default function HomePage() {
  const [liveList, setLiveList] = useState<LiveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLiveList() {
      try {
        const timestamp = Date.now();
        console.log(`[HomePage] 🔄 Fetching live list...`);
        const res = await fetch(`/api/live-list?t=${timestamp}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[HomePage] ❌ API error: ${res.status}`, errorText);
          setLiveList([]);
          return;
        }

        const data = await res.json();
        console.log(`[HomePage] 📊 API response:`, {
          success: data.success,
          count: data.liveList?.length || 0,
          hasDebug: !!data.debug,
        });

        if (data.debug) {
          console.log(`[HomePage] 🔍 Debug info:`, data.debug);
          if (data.debug.message) {
            console.log(`[HomePage] 💡 ${data.debug.message}`);
          }
          if (data.debug.diagnosticInfo) {
            console.log(`[HomePage] 🔬 진단 정보:`, data.debug.diagnosticInfo);
            if (data.debug.diagnosticInfo.youtubeQuotaExceeded) {
              console.warn(`[HomePage] ⚠️ YouTube API 할당량 초과 - 24시간 후 자동 재시도`);
            }
          }
        }

        if (data.success && data.liveList) {
          const allStreams = data.liveList;
          console.log(`[HomePage] 📺 Total streams: ${allStreams.length}`);
          
          const lives: LiveEntry[] = allStreams
            .filter((stream: any) => {
              const isLive = stream.isLive !== false; // undefined도 true로 처리
              if (!isLive) {
                console.log(`[HomePage] ⏭️ Skipping non-live stream: ${stream.bj?.name || 'unknown'}`);
              }
              return isLive;
            })
            .map((stream: any) => ({
              bj: stream.bj,
              title: stream.title || `${stream.bj.name}의 방송`,
              viewerCount: stream.viewerCount,
              startedAt: stream.startedAt,
              detectedCategories: stream.detectedCategories,
              primaryCategoryId: stream.primaryCategoryId,
            }));
          
          console.log(`[HomePage] ✅ Filtered to ${lives.length} live streams`);
          setLiveList(lives);
        } else {
          console.warn(`[HomePage] ⚠️ API returned error or no data:`, data.error || 'No liveList');
          console.warn(`[HomePage] 💡 문제 해결 방법:`);
          console.warn(`  1. 서버 터미널에서 [LiveList], [YouTube] 로그 확인`);
          console.warn(`  2. YouTube API 할당량 초과 시 24시간 후 자동 재시도`);
          console.warn(`  4. 개발 서버 재시작: npm run dev`);
          setLiveList([]);
        }
      } catch (error) {
        console.error("[HomePage] ❌ Failed to load live list:", error);
        setLiveList([]);
      } finally {
        setLoading(false);
      }
    }

    void loadLiveList();

    // 30초마다 자동 새로고침
    const interval = setInterval(() => {
      void loadLiveList();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const featured = liveList[0] ?? null;

  if (loading) {
    return (
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(260px,1fr)]">
        <section className="space-y-4 sm:space-y-6 order-2 lg:order-1">
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </section>
        <aside className="space-y-4 order-1 lg:order-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </aside>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(260px,1fr)]">
      <section className="space-y-4 sm:space-y-6 order-2 lg:order-1">
        <HeroCarousel featured={featured} allLives={liveList} />
        <LiveGrid lives={liveList} />
      </section>

      <aside className="space-y-4 order-1 lg:order-2">
        <MiniRankingBoard />
      </aside>
    </div>
  );
}
