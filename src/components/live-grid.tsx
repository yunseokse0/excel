"use client";

import Image from "next/image";
import { LiveEntry } from "../types/bj";
import { PlatformBadge } from "./platform-badge";
import { UniversalPlayerTrigger } from "./universal-player";

interface LiveGridProps {
  lives: LiveEntry[];
  quotaExceeded?: boolean;
}

export function LiveGrid({ lives, quotaExceeded = false }: LiveGridProps) {
  if (lives.length === 0) {
    return (
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
            인기 라이브 방송
          </h2>
          <span className="text-[11px] text-zinc-500">
            실시간 집계 · 방송 클릭 시 플레이어 오픈
          </span>
        </header>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-12 text-center">
          {quotaExceeded ? (
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold text-amber-400">
                  YouTube API 할당량 초과
                </p>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  YouTube API 일일 할당량이 초과되었습니다. 24시간 후 자동으로 재시도됩니다.
                </p>
                <div className="mt-4 text-xs text-zinc-500 space-y-1">
                  <p>💡 해결 방법:</p>
                  <ul className="list-disc list-inside space-y-1 text-left max-w-sm mx-auto">
                    <li>Google Cloud Console에서 할당량 증가 요청</li>
                    <li>추가 API 키 생성 및 사용</li>
                    <li>SOOP 방송은 정상적으로 표시됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              현재 방송 중인 BJ가 없습니다.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
          인기 라이브 방송
        </h2>
        <span className="text-[11px] text-zinc-500">
          실시간 집계 · 방송 클릭 시 플레이어 오픈
        </span>
      </header>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {lives.map((live) => (
          <UniversalPlayerTrigger
            key={live.bj.id}
            bj={live.bj}
            title={live.title}
          >
            <article className="group relative overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/60 p-2.5 shadow-[0_18px_45px_rgba(0,0,0,0.70)] transition-transform transition-shadow hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(0,0,0,0.9)]">
              <div className="relative aspect-video overflow-hidden rounded-xl">
                <Image
                  src={live.bj.thumbnailUrl || "/window.svg"}
                  alt={live.bj.name}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-110 group-hover:brightness-110"
                  unoptimized={live.bj.thumbnailUrl?.startsWith("http") ? false : true}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/window.svg";
                  }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-[2px] text-[10px] font-semibold text-white shadow-[0_0_15px_rgba(248,113,113,0.8)]">
                    LIVE
                  </span>
                  <PlatformBadge platform={live.bj.platform} size="xs" />
                </div>
              </div>

              <div className="mt-2.5 space-y-1.5">
                <h3 className="line-clamp-1 text-sm font-semibold text-zinc-50">
                  {live.title}
                </h3>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">{live.bj.name}</span>
                  {live.viewerCount && (
                    <span className="text-amber-300/90">
                      {live.viewerCount.toLocaleString()} 시청중
                    </span>
                  )}
                </div>
              </div>
            </article>
          </UniversalPlayerTrigger>
        ))}
      </div>
    </section>
  );
}

