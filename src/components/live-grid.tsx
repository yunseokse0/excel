"use client";

import Image from "next/image";
import { LiveEntry } from "../types/bj";
import { PlatformBadge } from "./platform-badge";
import { UniversalPlayerTrigger } from "./universal-player";

interface LiveGridProps {
  lives: LiveEntry[];
}

export function LiveGrid({ lives }: LiveGridProps) {
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
          지금 라이브 중인 엑셀 방송
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

