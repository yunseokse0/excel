"use client";

import { ReactNode, useState } from "react";
import { BJ } from "../types/bj";
import { X } from "lucide-react";

interface UniversalPlayerProps {
  bj: BJ;
  title?: string;
}

function getEmbedUrl(bj: BJ): string | null {
  if (!bj.streamUrl) return null;

  if (bj.platform === "youtube") {
    const url = new URL(bj.streamUrl);
    const id =
      url.searchParams.get("v") ||
      url.pathname.replace("/live/", "").replace("/", "");
    return `https://www.youtube.com/embed/${id}?autoplay=1`;
  }

  if (bj.platform === "soop") {
    return bj.streamUrl;
  }

  if (bj.platform === "panda") {
    return bj.streamUrl;
  }

  return null;
}

export function UniversalPlayer({ bj, title }: UniversalPlayerProps) {
  const embed = getEmbedUrl(bj);
  if (!embed) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black">
      <iframe
        src={embed}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        title={title || `${bj.name}의 방송 플레이어`}
      />
    </div>
  );
}

interface UniversalPlayerTriggerProps {
  bj: BJ;
  title?: string;
  children: ReactNode;
  size?: "md" | "sm";
}

export function UniversalPlayerTrigger({
  bj,
  title,
  children,
  size = "md",
}: UniversalPlayerTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left"
      >
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className={`relative w-full ${
              size === "md" ? "max-w-4xl" : "max-w-2xl"
            } mx-4 rounded-2xl border border-amber-500/40 bg-zinc-950/95 p-4 shadow-[0_40px_120px_rgba(0,0,0,1)]`}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-3 space-y-1 pr-8">
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-400">
                LIVE PLAYER
              </p>
              <h2 className="text-sm md:text-base font-semibold text-zinc-50">
                {title || bj.name}
              </h2>
              <p className="text-[11px] text-zinc-400">{bj.name}</p>
            </div>

            <UniversalPlayer bj={bj} title={title} />
          </div>
        </div>
      )}
    </>
  );
}

