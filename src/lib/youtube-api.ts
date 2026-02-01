/**
 * YouTube Data API v3 유틸리티 함수
 * 라이브 방송 정보를 가져오는 함수들
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface YouTubeLiveStatus {
  isLive: boolean;
  videoId?: string;
  title?: string;
  thumbnailUrl?: string;
  channelTitle?: string;
  viewerCount?: number;
  publishedAt?: string;
}

/**
 * YouTube 채널 ID로 현재 라이브 방송 정보를 가져옵니다.
 * @param channelId YouTube 채널 ID (예: "UC..." 또는 "@username")
 * @returns 라이브 방송 정보 또는 null
 */
export async function getYouTubeLiveStatus(
  channelId: string
): Promise<YouTubeLiveStatus | null> {
  // Placeholder 값 무시
  const isPlaceholder = (value: string | undefined) => {
    if (!value) return true;
    const placeholderPatterns = [
      "your_youtube_api_key",
      "your_api_key",
    ];
    return placeholderPatterns.some(pattern => 
      value.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  if (!YOUTUBE_API_KEY || isPlaceholder(YOUTUBE_API_KEY)) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[YouTube] YOUTUBE_API_KEY is not set or is a placeholder value");
      console.warn("[YouTube] YouTube 방송을 표시하려면 .env.local에 실제 API 키를 설정하세요");
    }
    return null;
  }

  // 채널 ID 정규화 (@username -> 채널 ID로 변환 필요할 수 있음)
  const normalizedChannelId = channelId.startsWith("@")
    ? channelId.slice(1)
    : channelId;

  try {
    // 1단계: 채널 ID로 라이브 방송 검색
    const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("channelId", normalizedChannelId);
    searchUrl.searchParams.set("eventType", "live");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", "1");
    searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      const error = await searchRes.json();
      console.error("YouTube API search error:", error);
      return { isLive: false };
    }

    const searchData = await searchRes.json();
    const liveVideo = searchData.items?.[0];

    if (!liveVideo) {
      return { isLive: false };
    }

    const videoId = liveVideo.id.videoId;

    // 2단계: 비디오 상세 정보 가져오기 (시청자 수 등)
    const videoUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    videoUrl.searchParams.set("part", "snippet,liveStreamingDetails,statistics");
    videoUrl.searchParams.set("id", videoId);
    videoUrl.searchParams.set("key", YOUTUBE_API_KEY);

    const videoRes = await fetch(videoUrl.toString());
    if (!videoRes.ok) {
      return {
        isLive: true,
        videoId,
        title: liveVideo.snippet.title,
        thumbnailUrl: liveVideo.snippet.thumbnails?.high?.url,
        channelTitle: liveVideo.snippet.channelTitle,
      };
    }

    const videoData = await videoRes.json();
    const video = videoData.items?.[0];

    if (!video) {
      return {
        isLive: true,
        videoId,
        title: liveVideo.snippet.title,
        thumbnailUrl: liveVideo.snippet.thumbnails?.high?.url,
        channelTitle: liveVideo.snippet.channelTitle,
      };
    }

    return {
      isLive: true,
      videoId,
      title: video.snippet.title,
      thumbnailUrl: video.snippet.thumbnails?.high?.url,
      channelTitle: video.snippet.channelTitle,
      viewerCount: video.liveStreamingDetails?.concurrentViewers
        ? parseInt(video.liveStreamingDetails.concurrentViewers, 10)
        : undefined,
      publishedAt: video.snippet.publishedAt,
    };
  } catch (error) {
    console.error("Failed to fetch YouTube live status:", error);
    return null;
  }
}

/**
 * YouTube 채널 URL에서 채널 ID를 추출합니다.
 * @param channelUrl 예: "https://www.youtube.com/@username" 또는 "https://www.youtube.com/channel/UC..."
 * @returns 채널 ID 또는 null
 */
export function extractYouTubeChannelId(channelUrl: string): string | null {
  try {
    const url = new URL(channelUrl);

    // @username 형식: https://www.youtube.com/@username
    if (url.pathname.startsWith("/@")) {
      return url.pathname.slice(1); // "@username" 반환
    }

    // 채널 ID 형식: https://www.youtube.com/channel/UC...
    if (url.pathname.startsWith("/channel/")) {
      return url.pathname.split("/channel/")[1];
    }

    // 사용자 형식: https://www.youtube.com/user/username (구버전)
    if (url.pathname.startsWith("/user/")) {
      return url.pathname.split("/user/")[1];
    }

    return null;
  } catch {
    return null;
  }
}
