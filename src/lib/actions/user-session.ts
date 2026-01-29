"use server";

import { cookies } from "next/headers";
import { getSupabaseServerClient } from "../supabase-server";

const SESSION_COOKIE_NAME = "excel_session_id";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30일

export type UserGroup = "new" | "returning" | "vip";

/**
 * 사용자 세션 ID를 가져오거나 생성합니다.
 * Frontend 기반 모드에서는 쿠키만 사용합니다.
 */
export async function getOrCreateSession(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    // 새 세션 생성
    sessionId = crypto.randomUUID();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      maxAge: SESSION_DURATION,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  // Supabase가 설정된 경우에만 세션 정보 업데이트
  const supabase = getSupabaseServerClient();
  if (supabase) {
    await updateSession(sessionId);
  }

  return sessionId;
}

/**
 * 세션 정보를 업데이트합니다.
 * Supabase가 없으면 아무 작업도 하지 않습니다.
 */
async function updateSession(sessionId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return; // Frontend 기반 모드에서는 건너뛰기

  try {
    // 기존 세션 확인
    const { data: existing } = await supabase
      .from("user_sessions")
      .select("id, visit_count, user_group")
      .eq("session_id", sessionId)
      .single();

    const now = new Date().toISOString();

    if (existing) {
      // 기존 세션 업데이트
      const visitCount = existing.visit_count + 1;
      let userGroup: UserGroup = existing.user_group as UserGroup;

      // 방문 횟수에 따라 사용자 그룹 결정
      if (visitCount >= 10) {
        userGroup = "vip";
      } else if (visitCount >= 2) {
        userGroup = "returning";
      }

      await supabase
        .from("user_sessions")
        .update({
          last_visit_at: now,
          visit_count: visitCount,
          user_group: userGroup,
          updated_at: now,
        })
        .eq("session_id", sessionId);
    } else {
      // 새 세션 생성
      await supabase.from("user_sessions").insert({
        session_id: sessionId,
        user_group: "new",
        first_visit_at: now,
        last_visit_at: now,
        visit_count: 1,
      });
    }
  } catch (error) {
    // Supabase 에러는 무시 (Frontend 기반 모드)
    console.warn("Failed to update session in Supabase:", error);
  }
}

/**
 * 현재 사용자의 그룹을 가져옵니다.
 * Frontend 기반 모드에서는 localStorage에서 가져옵니다.
 */
export async function getUserGroup(): Promise<UserGroup> {
  const supabase = getSupabaseServerClient();
  
  if (!supabase) {
    // Frontend 기반 모드: 기본값 반환
    return "new";
  }

  try {
    const sessionId = await getOrCreateSession();
    const { data } = await supabase
      .from("user_sessions")
      .select("user_group")
      .eq("session_id", sessionId)
      .single();

    return (data?.user_group as UserGroup) || "new";
  } catch (error) {
    // Supabase 에러는 무시하고 기본값 반환
    return "new";
  }
}
