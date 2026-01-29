/**
 * SOOP(아프리카TV) API 유틸리티 함수
 * 비공식 API 엔드포인트를 사용하여 라이브 방송 정보를 가져옵니다.
 */

export interface SoopLiveStatus {
  isLive: boolean;
  broadcastNo?: string;
  title?: string;
  thumbnailUrl?: string;
  viewerCount?: number;
  startedAt?: string;
}

/**
 * 아프리카TV BJ ID로 현재 라이브 방송 정보를 가져옵니다.
 * @param bjId 아프리카TV BJ ID (예: "bjid123")
 * @returns 라이브 방송 정보 또는 null
 */
export async function getSoopLiveStatus(
  bjId: string
): Promise<SoopLiveStatus | null> {
  try {
    // 아프리카TV 비공식 API 엔드포인트 (실제 엔드포인트는 네트워크 탭에서 확인 필요)
    // 일반적으로 사용되는 패턴:
    const apiUrl = `https://bjapi.afreecatv.com/api/${bjId}/station`;

    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.afreecatv.com/",
      },
    });

    if (!res.ok) {
      // API 호출 실패 시 HTML 크롤링 시도
      return await getSoopLiveStatusFromHTML(bjId);
    }

    const data = await res.json() as any;

    // 방송 상태 확인
    const isLive =
      data.broad && data.broad.broad_state === "ON_AIR" ? true : false;

    if (!isLive) {
      return { isLive: false };
    }

    return {
      isLive: true,
      broadcastNo: data.broad?.broad_no?.toString(),
      title: data.broad?.broad_title,
      thumbnailUrl: data.broad?.thumbnail,
      viewerCount: data.broad?.total_view_cnt
        ? parseInt(data.broad.total_view_cnt, 10)
        : undefined,
      startedAt: data.broad?.broad_start,
    };
  } catch (error) {
    console.error("Failed to fetch SOOP live status:", error);
    // HTML 크롤링으로 폴백
    return await getSoopLiveStatusFromHTML(bjId);
  }
}

/**
 * HTML 크롤링으로 SOOP 라이브 상태 확인 (폴백)
 */
async function getSoopLiveStatusFromHTML(
  bjId: string
): Promise<SoopLiveStatus | null> {
  try {
    const url = `https://bj.afreecatv.com/${bjId}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      return { isLive: false };
    }

    const html = await res.text();

    // 간단한 HTML 파싱 (실제로는 cheerio 같은 라이브러리 사용 권장)
    // 여기서는 기본적인 패턴만 확인
    const isLive = html.includes("ON_AIR") || html.includes("방송중");

    if (!isLive) {
      return { isLive: false };
    }

    // 제목 추출 시도
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1] : undefined;

    return {
      isLive: true,
      title,
      // 실제 구현에서는 더 정교한 파싱 필요
    };
  } catch (error) {
    console.error("Failed to fetch SOOP HTML:", error);
    return null;
  }
}

/**
 * 아프리카TV 채널 URL에서 BJ ID를 추출합니다.
 * @param channelUrl 예: "https://bj.afreecatv.com/bjid123" 또는 "https://play.afreecatv.com/bjid123/123456"
 * @returns BJ ID 또는 null
 */
export function extractSoopBJId(channelUrl: string): string | null {
  try {
    const url = new URL(channelUrl);

    // https://bj.afreecatv.com/bjid123 형식
    if (url.hostname.includes("afreecatv.com")) {
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        return pathParts[0];
      }
    }

    return null;
  } catch {
    return null;
  }
}
