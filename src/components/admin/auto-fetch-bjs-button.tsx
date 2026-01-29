"use client";

import { useState } from "react";
import { RefreshCw, Youtube } from "lucide-react";
import { useToast } from "../ui/toast-context";

export function AutoFetchBJsButton() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleAutoFetch = async (platform: "youtube" | "soop" | "all") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auto-fetch-bjs?platform=${platform}`);
      const data = await res.json();

      if (data.success) {
        showToast({
          title: "BJ 자동 가져오기 완료",
          description: data.message || `${data.added?.length || 0}개의 BJ가 추가되었습니다.`,
          variant: "success",
        });
        // 페이지 새로고침하여 목록 업데이트
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showToast({
          title: "자동 가져오기 실패",
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
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAutoFetch("youtube")}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-red-500/70 bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/30 disabled:opacity-60 transition"
      >
        <Youtube className="h-3.5 w-3.5" />
        <span>YouTube 자동 가져오기</span>
        {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
      </button>
    </div>
  );
}
