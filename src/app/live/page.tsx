"use client";

import { useEffect, useState } from "react";
import { LiveGrid } from "../../components/live-grid";
import type { LiveEntry } from "../../types/bj";

export default function LivePage() {
  const [liveList, setLiveList] = useState<LiveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLiveList() {
      try {
        const res = await fetch("/api/live-list");
        const data = await res.json();
        
        if (data.success && data.liveList) {
          const lives: LiveEntry[] = data.liveList
            .filter((stream: any) => stream.isLive)
            .map((stream: any) => ({
              bj: stream.bj,
              title: stream.title || `${stream.bj.name}의 방송`,
              viewerCount: stream.viewerCount,
              startedAt: stream.startedAt,
              detectedCategories: stream.detectedCategories,
              primaryCategoryId: stream.primaryCategoryId,
            }));
          setLiveList(lives);
        }
      } catch (error) {
        console.error("Failed to load live list:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadLiveList();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            인기 라이브 방송
          </h1>
          <p className="text-sm text-zinc-400">
            지금 가장 인기 있는 라이브 방송을 플랫폼 구분 없이 한눈에 만나보세요.
          </p>
        </header>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-zinc-500">라이브 방송 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          전체 라이브 목록
        </h1>
        <p className="text-sm text-zinc-400">
          현재 방송 중인 모든 BJ를 플랫폼 구분 없이 한눈에 볼 수 있습니다.
        </p>
      </header>
      <LiveGrid lives={liveList} />
    </div>
  );
}

