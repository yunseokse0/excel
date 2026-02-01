"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ExternalLink, Users } from "lucide-react";
import { PlatformBadge } from "../../../components/platform-badge";
import { UniversalPlayerTrigger } from "../../../components/universal-player";
import { useToast } from "../../../components/ui/toast-context";
import Link from "next/link";
import type { BJ } from "../../../types/bj";

interface LiveStreamInfo {
  bj: {
    id: string;
    name: string;
    platform: "youtube" | "soop";
    isLive: boolean;
    currentScore: number;
    thumbnailUrl: string;
    channelUrl: string;
    streamUrl?: string;
  };
  isLive: boolean;
  title?: string;
  thumbnailUrl?: string;
  viewerCount?: number;
  streamUrl?: string;
  startedAt?: string;
}

export default function LiveListPage() {
  const [liveList, setLiveList] = useState<LiveStreamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<"all" | "youtube" | "soop">("all");
  const { showToast } = useToast();

  const loadLiveList = async () => {
    try {
      const url = platformFilter === "all" 
        ? "/api/live-list"
        : `/api/live-list?platform=${platformFilter}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setLiveList(data.liveList);
      } else {
        showToast({
          title: "라이브 목록 불러오기 실패",
          description: data.error,
          variant: "error",
        });
      }
    } catch (error) {
      showToast({
        title: "오류",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadLiveList();
  }, [platformFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadLiveList();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-zinc-500">라이브 방송 목록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            인기 라이브 방송
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            YouTube와 SOOP에서 지금 가장 인기 있는 라이브 방송을 확인하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as any)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 outline-none focus:border-amber-500"
          >
            <option value="all">전체</option>
            <option value="youtube">YouTube</option>
            <option value="soop">SOOP</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/70 bg-blue-500/20 px-4 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/30 disabled:opacity-60 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {liveList.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-12 text-center">
          <p className="text-sm text-zinc-500">
            현재 방송 중인 BJ가 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {liveList.map((item) => (
            <UniversalPlayerTrigger
              key={item.bj.id}
              bj={item.bj as BJ}
              title={item.title}
            >
              <div className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-950/80 overflow-hidden hover:border-amber-500/50 transition cursor-pointer">
                <div className="relative aspect-video bg-zinc-900">
                  <img
                    src={item.thumbnailUrl || item.bj.thumbnailUrl || "/placeholder.jpg"}
                    alt={item.bj.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                      LIVE
                    </span>
                    <PlatformBadge platform={item.bj.platform as "youtube"} />
                  </div>
                  {item.viewerCount !== undefined && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] text-zinc-100">
                      <Users className="h-3 w-3" />
                      <span>{item.viewerCount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-50 line-clamp-1">
                    {item.title || `${item.bj.name}의 방송`}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-400">{item.bj.name}</p>
                    <a
                      href={item.bj.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-zinc-400 hover:text-amber-300 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </UniversalPlayerTrigger>
          ))}
        </div>
      )}

      <div className="text-center text-xs text-zinc-500 pt-4">
        총 {liveList.length}개의 방송이 진행 중입니다.
      </div>
    </div>
  );
}
