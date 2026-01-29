"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { getActiveAds } from "../../lib/actions/ad-management";
import { getUserGroup } from "../../lib/actions/user-session";
import type { Ad } from "../../types/ad";

export function TopBanner() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function loadAds() {
      // 사용자 그룹 가져오기
      const userGroup = await getUserGroup();
      // 타겟팅을 위해 현재 페이지 경로와 사용자 그룹 전달
      const result = await getActiveAds("top_banner", pathname, userGroup);
      if (result.success && result.ads.length > 0) {
        setAds(result.ads);
        // 노출 수 추적
        result.ads.forEach((ad) => {
          void fetch("/api/ad/impression", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adId: ad.id, pagePath: pathname }),
          }).catch(() => {});
        });
      }
    }
    void loadAds();
  }, [pathname]);

  if (!isVisible || ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleClick = async () => {
    if (currentAd.linkUrl) {
      window.open(currentAd.linkUrl, "_blank", "noopener,noreferrer");
      // 클릭 수 증가 (비동기, 에러 무시)
      void fetch("/api/ad/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: currentAd.id, pagePath: pathname }),
      }).catch(() => {});
    }
  };

  return (
    <div className="relative w-full bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {ads.length > 1 && (
          <button
            onClick={handleNext}
            className="text-zinc-400 hover:text-zinc-200 text-xs px-2 py-1 sm:px-0 sm:py-0"
            aria-label="다음 광고"
          >
            <span className="hidden sm:inline">다음</span>
            <span className="sm:hidden">→</span>
          </button>
        )}
        <button
          onClick={handleClick}
          className="flex-1 flex items-center justify-center min-h-[40px] sm:min-h-0"
        >
          <img
            src={currentAd.imageUrl}
            alt={currentAd.title || "광고"}
            className="max-h-12 sm:max-h-16 w-auto object-contain"
          />
        </button>
        <button
          onClick={handleClose}
          className="text-zinc-400 hover:text-zinc-200 transition p-1.5 sm:p-0"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {ads.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {ads.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition ${
                idx === currentIndex ? "w-4 bg-amber-400" : "w-1 bg-zinc-600"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
