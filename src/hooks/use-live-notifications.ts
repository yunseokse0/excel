"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import { useToast } from "../components/ui/toast-context";

/**
 * 라이브 방송 알림 훅
 * Supabase Realtime을 구독하여 새로운 라이브 방송이 시작되면 알림을 표시합니다.
 */
export function useLiveNotifications() {
  const { showToast } = useToast();
  const notifiedBJIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 브라우저 알림 권한 요청
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Supabase 클라이언트 가져오기
    const supabase = getSupabaseBrowserClient();
    
    // Frontend 기반 모드: Supabase가 없으면 알림 기능 비활성화
    if (!supabase) {
      console.warn("Supabase not configured. Live notifications disabled.");
      return;
    }

    // live_streams 테이블 변경 감지
    const channel = supabase
      .channel("live-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_streams",
        },
        async (payload: any) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;

          // 라이브 상태가 false → true로 변경된 경우 (새로운 라이브 시작)
          if (!oldData.is_live && newData.is_live) {
            const bjId = newData.bj_id;

            // 이미 알림을 보낸 BJ는 제외 (중복 방지)
            if (notifiedBJIds.current.has(bjId)) {
              return;
            }

            // BJ 정보 가져오기
            const { data: bj } = await supabase
              .from("bjs")
              .select("name, platform")
              .eq("id", bjId)
              .single();

            if (bj) {
              const bjName = bj.name;
              const platformName =
                bj.platform === "youtube"
                  ? "YouTube"
                  : bj.platform === "soop"
                  ? "SOOP"
                  : "Unknown";

              // 토스트 알림
              showToast({
                title: "🎉 새로운 라이브 방송 시작!",
                description: `${bjName}님이 ${platformName}에서 방송을 시작했습니다.`,
                variant: "success",
              });

              // 브라우저 알림 (권한이 있는 경우)
              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification(`${bjName}님의 라이브 방송`, {
                  body: `${platformName}에서 방송을 시작했습니다.`,
                  icon: "/favicon.ico",
                  tag: `live-${bjId}`, // 중복 알림 방지
                });
              }

              // 알림 기록
              notifiedBJIds.current.add(bjId);

              // 1시간 후 알림 기록 초기화 (같은 BJ가 다시 방송 시작할 수 있도록)
              setTimeout(() => {
                notifiedBJIds.current.delete(bjId);
              }, 60 * 60 * 1000);
            }
          }

          // 라이브 상태가 true → false로 변경된 경우 (방송 종료)
          if (oldData.is_live && !newData.is_live) {
            const bjId = newData.bj_id;
            // 방송 종료 시 알림 기록에서 제거
            notifiedBJIds.current.delete(bjId);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [showToast]);
}
