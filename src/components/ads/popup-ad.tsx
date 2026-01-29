"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { getActiveAds } from "../../lib/actions/ad-management";
import type { Ad } from "../../types/ad";

export function PopupAd() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenToday, setHasSeenToday] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function loadAds() {
      const { getUserGroup } = await import("../../lib/actions/user-session");
      const userGroup = await getUserGroup();
      const result = await getActiveAds("popup", pathname, userGroup);
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
        // 오늘 이미 본 팝업인지 확인
        const lastSeen = localStorage.getItem("popup_ad_seen");
        const today = new Date().toDateString();
        if (lastSeen !== today) {
          setIsVisible(true);
        }
      }
    }
    void loadAds();
  }, [pathname]);

  if (!isVisible || ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  const handleClose = () => {
    setIsVisible(false);
    // 오늘 본 팝업으로 기록
    localStorage.setItem("popup_ad_seen", new Date().toDateString());
    setHasSeenToday(true);
  };

  const handleClick = async () => {
    if (currentAd.linkUrl) {
      window.open(currentAd.linkUrl, "_blank", "noopener,noreferrer");
      void fetch("/api/ad/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: currentAd.id, pagePath: pathname }),
      }).catch(() => {});
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-800 shadow-2xl max-w-2xl w-full overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-zinc-200 transition bg-zinc-800/80 rounded-full p-1.5"
        >
          <X className="h-5 w-5" />
        </button>

        <button onClick={handleClick} className="w-full">
          <img
            src={currentAd.imageUrl}
            alt={currentAd.title || "광고"}
            className="w-full h-auto object-contain"
          />
        </button>

        {ads.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {ads.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition ${
                  idx === currentIndex ? "w-8 bg-amber-400" : "w-2 bg-zinc-600"
                }`}
              />
            ))}
          </div>
        )}

        {ads.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute bottom-4 right-4 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 px-3 py-1.5 rounded-full"
          >
            다음
          </button>
        )}
      </div>
    </div>
  );
}
