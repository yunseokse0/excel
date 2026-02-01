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
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          커뮤니티
        </h1>
        <p className="text-sm text-zinc-400">
          실시간 방송 중인 BJ들을 카드 형태로 만나보세요
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
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          커뮤니티
        </h1>
        <p className="text-sm text-zinc-400">
          실시간 방송 중인 BJ들을 카드 형태로 만나보세요
        </p>
      </header>
      <LiveGrid lives={liveList} />
    </div>
  );
}

