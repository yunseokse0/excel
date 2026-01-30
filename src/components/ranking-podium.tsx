import Image from "next/image";
import { RankingEntry } from "../types/bj";
import { PlatformBadge } from "./platform-badge";

interface PodiumProps {
  ranking: RankingEntry[];
}

export function Podium({ ranking }: PodiumProps) {
  const [first, second, third] = ranking;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-900/40 via-zinc-950 to-black px-5 py-6 shadow-[0_32px_90px_rgba(0,0,0,0.95)]">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
        PODIUM
      </p>
      <div className="grid grid-cols-3 items-end gap-2">
        {second && (
          <PodiumItem
            placement={2}
            entry={second}
            heightClass="h-24"
            accent="silver"
          />
        )}
        {first && (
          <PodiumItem
            placement={1}
            entry={first}
            heightClass="h-32"
            accent="gold"
          />
        )}
        {third && (
          <PodiumItem
            placement={3}
            entry={third}
            heightClass="h-20"
            accent="bronze"
          />
        )}
      </div>
    </div>
  );
}

interface PodiumItemProps {
  placement: 1 | 2 | 3;
  entry: RankingEntry;
  heightClass: string;
  accent: "gold" | "silver" | "bronze";
}

function PodiumItem({
  placement,
  entry,
  heightClass,
  accent,
}: PodiumItemProps) {
  const accentColor =
    accent === "gold"
      ? "from-yellow-400/90 via-amber-400/90 to-yellow-300/80"
      : accent === "silver"
      ? "from-zinc-200/90 via-zinc-100/90 to-zinc-50/80"
      : "from-orange-400/90 via-amber-500/90 to-orange-300/80";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-12 w-12 overflow-hidden rounded-full border border-amber-400/60 bg-zinc-900 shadow-[0_0_22px_rgba(250,204,21,0.5)]">
        <Image
          src={entry.bj.thumbnailUrl || "/window.svg"}
          alt={entry.bj.name}
          fill
          className="object-cover"
        />
      </div>
      <div
        className={`flex w-full flex-col items-center justify-end rounded-2xl bg-zinc-900/80 ${heightClass} pb-2`}
      >
        <div
          className={`mb-1 inline-flex items-center justify-center rounded-full bg-gradient-to-r ${accentColor} px-2 py-[2px] text-[10px] font-semibold text-black`}
        >
          #{placement}
        </div>
        <p className="line-clamp-1 text-center text-[11px] font-medium text-zinc-50">
          {entry.bj.name}
        </p>
        <p className="text-[10px] text-amber-200/90">
          {entry.viewerCount.toLocaleString()}명
        </p>
        <div className="mt-1">
          <PlatformBadge platform={entry.bj.platform} size="xs" />
        </div>
      </div>
    </div>
  );
}

