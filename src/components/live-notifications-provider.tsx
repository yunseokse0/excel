"use client";

import { useLiveNotifications } from "../hooks/use-live-notifications";

/**
 * 라이브 알림 Provider 컴포넌트
 * 앱 전체에서 라이브 방송 알림을 받기 위해 레이아웃에 추가합니다.
 */
export function LiveNotificationsProvider() {
  useLiveNotifications();
  return null;
}
