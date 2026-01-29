"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useToast } from "../ui/toast-context";

export function YouTubeSyncButton() {
  const [syncing, setSyncing] = useState(false);
  const { showToast } = useToast();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync-youtube");
      const data = await res.json();

      if (data.success) {
        showToast({
          title: "YouTube 라이브 동기화 완료",
          description: `${data.synced}개 BJ의 라이브 상태를 업데이트했습니다.`,
          variant: "success",
        });
      } else {
        showToast({
          title: "동기화 실패",
          description: data.error ?? "YouTube 라이브 상태 동기화에 실패했습니다.",
          variant: "error",
        });
      }
    } catch (error) {
      showToast({
        title: "동기화 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "error",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={syncing}
      className="inline-flex items-center gap-2 rounded-full border border-blue-500/70 bg-blue-500/20 px-4 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/30 disabled:opacity-60 transition"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
      <span>{syncing ? "동기화 중..." : "YouTube 라이브 동기화"}</span>
    </button>
  );
}
