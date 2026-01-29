"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ExternalLink, Users, Search, Star, StarOff, Clock, ArrowUpDown } from "lucide-react";
import { PlatformBadge } from "../../components/platform-badge";
import { UniversalPlayerTrigger } from "../../components/universal-player";
import { useToast } from "../../components/ui/toast-context";

interface LiveStreamInfo {
  bj: {
    id: string;
    name: string;
    platform: "youtube" | "soop" | "panda";
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

type SortOption = "viewer" | "started" | "name";
type SortOrder = "asc" | "desc";

export default function LiveListPage() {
  const [liveList, setLiveList] = useState<LiveStreamInfo[]>([]);
  const [filteredList, setFilteredList] = useState<LiveStreamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<"all" | "youtube" | "soop">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("viewer");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { showToast } = useToast();

  // 즐겨찾기 로드
  useEffect(() => {
    const savedFavorites = localStorage.getItem("live_list_favorites");
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      } catch {
        // 무시
      }
    }
  }, []);

  // 즐겨찾기 저장
  const saveFavorites = (newFavorites: Set<string>) => {
    setFavorites(newFavorites);
    localStorage.setItem("live_list_favorites", JSON.stringify(Array.from(newFavorites)));
  };

  const toggleFavorite = (bjId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(bjId)) {
      newFavorites.delete(bjId);
    } else {
      newFavorites.add(bjId);
    }
    saveFavorites(newFavorites);
  };

  const loadLiveList = async () => {
    try {
      const url = platformFilter === "all" 
        ? "/api/live-list"
        : `/api/live-list?platform=${platformFilter}`;
      
      console.log(`[Client] Fetching live list from: ${url}`);
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[Client] API error: ${res.status}`, errorText);
        showToast({
          title: "라이브 목록 불러오기 실패",
          description: `서버 오류 (${res.status})`,
          variant: "error",
        });
        return;
      }
      
      const data = await res.json();
      console.log(`[Client] Received data:`, { success: data.success, count: data.count || data.liveList?.length || 0 });

      if (data.success) {
        // 이전 데이터와 비교하여 변경사항 확인
        const prevCount = liveList.length;
        const newCount = data.liveList?.length || 0;
        
        setLiveList(data.liveList || []);
        
        if (newCount === 0) {
          console.warn("[Client] No live streams found");
          if (prevCount > 0) {
            // 이전에는 있었는데 지금 없으면 알림
            showToast({
              title: "알림",
              description: "현재 방송 중인 BJ가 없습니다.",
              variant: "info",
            });
          }
        } else {
          console.log(`[Client] Successfully loaded ${newCount} live streams (was ${prevCount})`);
          // 데이터가 변경되었으면 알림 (자동 새로고침일 때만)
          if (autoRefresh && prevCount > 0 && prevCount !== newCount) {
            console.log(`[Client] Live stream count changed: ${prevCount} -> ${newCount}`);
          }
        }
      } else {
        console.error("[Client] API returned error:", data.error);
        showToast({
          title: "라이브 목록 불러오기 실패",
          description: data.error || "알 수 없는 오류",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("[Client] Fetch error:", error);
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

  // 필터링 및 정렬
  useEffect(() => {
    let filtered = [...liveList];

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.bj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 즐겨찾기 필터
    if (showFavoritesOnly) {
      filtered = filtered.filter((item) => favorites.has(item.bj.id));
    }

    // 정렬
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortOption) {
        case "viewer":
          comparison = (b.viewerCount || 0) - (a.viewerCount || 0);
          break;
        case "started":
          const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
          const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
          comparison = bTime - aTime;
          break;
        case "name":
          comparison = a.bj.name.localeCompare(b.bj.name, "ko");
          break;
      }

      return sortOrder === "asc" ? -comparison : comparison;
    });

    setFilteredList(filtered);
  }, [liveList, searchQuery, showFavoritesOnly, favorites, sortOption, sortOrder]);

  useEffect(() => {
    void loadLiveList();
  }, [platformFilter]);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    // 즉시 한 번 실행
    const refresh = () => {
      setRefreshing(true);
      void loadLiveList();
    };

    // 30초마다 자동 새로고침
    const interval = setInterval(refresh, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, platformFilter]);

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
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-50">
              현재 방송 중인 리스트
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              YouTube와 SOOP에서 현재 방송 중인 BJ 목록입니다.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition flex-shrink-0 ${
                autoRefresh
                  ? "border-green-500/70 bg-green-500/20 text-green-200"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400"
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">자동 새로고침</span>
              <span className="sm:hidden">자동</span>
            </button>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as any)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 sm:px-3 py-1.5 text-xs text-zinc-50 outline-none focus:border-amber-500 flex-shrink-0"
            >
              <option value="all">전체</option>
              <option value="youtube">YouTube</option>
              <option value="soop">SOOP</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-blue-500/70 bg-blue-500/20 px-3 sm:px-4 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/30 disabled:opacity-60 transition flex-shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>새로고침</span>
            </button>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="BJ 이름 또는 방송 제목 검색..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-50 placeholder-zinc-500 outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2.5 sm:py-2 text-xs font-semibold transition flex-shrink-0 ${
                showFavoritesOnly
                  ? "border-amber-500/70 bg-amber-500/20 text-amber-200"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {showFavoritesOnly ? (
                <Star className="h-4 w-4 sm:h-3.5 sm:w-3.5 fill-amber-400 text-amber-400" />
              ) : (
                <StarOff className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              )}
              <span className="hidden sm:inline">즐겨찾기만</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ArrowUpDown className="h-4 w-4 text-zinc-400 hidden sm:block" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 sm:px-3 py-2.5 sm:py-1.5 text-xs text-zinc-50 outline-none focus:border-amber-500 flex-1 sm:flex-none"
              >
                <option value="viewer">시청자 수</option>
                <option value="started">방송 시작 시간</option>
                <option value="name">이름순</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 sm:px-2 py-2.5 sm:py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 min-w-[40px]"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-12 text-center">
          <p className="text-sm text-zinc-500">
            {searchQuery || showFavoritesOnly
              ? "검색 결과가 없습니다."
              : "현재 방송 중인 BJ가 없습니다."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((item) => (
            <UniversalPlayerTrigger
              key={item.bj.id}
              bj={item.bj}
              title={item.title}
            >
              <div className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-950/80 overflow-hidden hover:border-amber-500/50 transition cursor-pointer">
                <div className="relative aspect-video bg-zinc-900">
                  <img
                    src={item.thumbnailUrl || item.bj.thumbnailUrl || "/window.svg"}
                    alt={item.bj.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/window.svg";
                    }}
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                      LIVE
                    </span>
                    <PlatformBadge platform={item.bj.platform} />
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    {item.viewerCount !== undefined && (
                      <div className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] text-zinc-100">
                        <Users className="h-3 w-3" />
                        <span>{item.viewerCount.toLocaleString()}</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.bj.id);
                      }}
                      className="rounded-full bg-black/70 p-1.5 hover:bg-black/90 transition"
                    >
                      {favorites.has(item.bj.id) ? (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ) : (
                        <StarOff className="h-3.5 w-3.5 text-zinc-400" />
                      )}
                    </button>
                  </div>
                  {item.startedAt && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] text-zinc-100">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(item.startedAt).toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
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
        {filteredList.length !== liveList.length
          ? `검색 결과: ${filteredList.length}개 / 전체: ${liveList.length}개`
          : `총 ${liveList.length}개의 방송이 진행 중입니다.`}
      </div>
    </div>
  );
}
