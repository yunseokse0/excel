import Image from "next/image";
import { LiveEntry } from "../types/bj";
import { PlatformBadge } from "./platform-badge";
import { UniversalPlayerTrigger } from "./universal-player";

interface HeroCarouselProps {
  featured: LiveEntry | null;
  allLives: LiveEntry[];
}

export function HeroCarousel({ featured, allLives }: HeroCarouselProps) {
  if (!featured) return null;

  const secondary = allLives.slice(1, 4);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-50">
            오늘의 가장 뜨거운 엑셀 방송
          </h1>
          <p className="text-xs md:text-sm text-zinc-400">
            상단 캐러셀에서 바로 재생하거나 우측 카드에서 다른 방송을 선택하세요.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
        <UniversalPlayerTrigger bj={featured.bj} title={featured.title}>
          <article className="group relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/40 p-[1px] shadow-[0_30px_80px_rgba(0,0,0,0.9)]">
            <div className="relative overflow-hidden rounded-[22px] bg-zinc-950">
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={featured.bj.thumbnailUrl || "/window.svg"}
                  alt={featured.bj.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110 group-hover:brightness-110"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                <div className="absolute left-4 top-4 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold text-white shadow-[0_0_22px_rgba(248,113,113,0.9)]">
                    LIVE TOP
                  </span>
                  <PlatformBadge platform={featured.bj.platform} />
                </div>

                <div className="absolute bottom-4 left-4 right-4 space-y-1.5">
                  <h2 className="line-clamp-1 text-lg md:text-2xl font-semibold text-zinc-50">
                    {featured.title}
                  </h2>
                  <div className="flex items-center justify-between text-xs md:text-sm text-zinc-300">
                    <span className="font-medium">{featured.bj.name}</span>
                    {featured.viewerCount && (
                      <span className="text-amber-300/90">
                        {featured.viewerCount.toLocaleString()} 시청중
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </UniversalPlayerTrigger>

        <div className="space-y-2">
          {secondary.map((live) => (
            <UniversalPlayerTrigger
              key={live.bj.id}
              bj={live.bj}
              title={live.title}
              size="sm"
            >
              <article className="group flex gap-3 rounded-2xl border border-zinc-800/70 bg-zinc-950/70 p-2.5 transition hover:border-amber-500/70 hover:bg-zinc-900/80 hover:shadow-[0_16px_40px_rgba(0,0,0,0.85)]">
                <div className="relative h-16 w-28 overflow-hidden rounded-xl">
                  <Image
                    src={live.bj.thumbnailUrl || "/window.svg"}
                    alt={live.bj.name}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-110 group-hover:brightness-110"
                  />
                  <div className="absolute left-1.5 top-1.5">
                    <PlatformBadge platform={live.bj.platform} size="xs" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <h3 className="line-clamp-1 text-xs font-semibold text-zinc-50">
                    {live.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{live.bj.name}</span>
                    {live.viewerCount && (
                      <span className="text-amber-300/90">
                        {live.viewerCount.toLocaleString()}명
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </UniversalPlayerTrigger>
          ))}
        </div>
      </div>
    </section>
  );
}

