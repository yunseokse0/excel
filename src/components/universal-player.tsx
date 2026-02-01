"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BJ } from "../types/bj";
import { X, MessageSquare, ArrowLeft } from "lucide-react";
import { LiveChat } from "./live-chat";

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
  const [showChat, setShowChat] = useState(true);
  const router = useRouter();

  // 모달 열릴 때 히스토리 추가
  useEffect(() => {
    if (open) {
      // 현재 URL에 쿼리 파라미터 추가
      const url = new URL(window.location.href);
      url.searchParams.set('player', bj.id);
      window.history.pushState({ player: bj.id }, '', url.toString());

      // 뒤로가기 이벤트 리스너
      const handlePopState = (e: PopStateEvent) => {
        if (e.state?.player === bj.id || !e.state) {
          setOpen(false);
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    } else {
      // 모달이 닫힐 때 쿼리 파라미터 제거
      const url = new URL(window.location.href);
      if (url.searchParams.get('player') === bj.id) {
        url.searchParams.delete('player');
        window.history.replaceState(null, '', url.toString());
      }
    }
  }, [open, bj.id]);

  const handleClose = () => {
    setOpen(false);
    // 뒤로가기로 닫기
    if (window.history.length > 1) {
      router.back();
    } else {
      // 히스토리가 없으면 쿼리만 제거
      const url = new URL(window.location.href);
      url.searchParams.delete('player');
      window.history.replaceState(null, '', url.toString());
    }
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="w-full cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {children}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
          {/* 모바일: 뒤로가기 버튼 */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-zinc-800/70 bg-zinc-950/90">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>뒤로</span>
            </button>
            <button
              type="button"
              onClick={() => setShowChat(!showChat)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{showChat ? "채팅 숨기기" : "채팅 보기"}</span>
            </button>
          </div>

          {/* 데스크톱: 닫기 버튼 */}
          <button
            type="button"
            onClick={handleClose}
            className="hidden lg:block absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex-1 overflow-y-auto">
            <div
              className={`relative w-full ${
                size === "md" ? "max-w-6xl" : "max-w-4xl"
              } mx-auto px-4 py-4 lg:py-6`}
            >
              {/* 제목 (데스크톱에서 위에, 모바일에서 두 번째) */}
              <div className="mb-4 lg:mb-3 space-y-1 order-2 lg:order-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-amber-400">
                  LIVE PLAYER
                </p>
                <h2 className="text-base md:text-lg font-semibold text-zinc-50">
                  {title || bj.name}
                </h2>
                <p className="text-sm text-zinc-400">{bj.name}</p>
              </div>

              {/* 모바일 레이아웃: 방송화면 → 제목 → 채팅 */}
              {/* 데스크톱 레이아웃: 방송화면과 채팅을 나란히 */}
              <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-4">
                {/* 방송화면 (모바일에서 첫 번째, 데스크톱에서 왼쪽) */}
                <div className="order-1 lg:order-1">
                  <UniversalPlayer bj={bj} title={title} />
                </div>

                {/* 채팅 (모바일에서 세 번째, 데스크톱에서 오른쪽) */}
                {showChat && (
                  <div className="order-3 lg:order-2 h-[400px] lg:h-auto">
                    <LiveChat bjId={bj.id} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

