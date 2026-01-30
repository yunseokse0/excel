import type { BJ, RankingEntry, LiveEntry } from "../types/bj";

// Placeholder 이미지 URL 사용 (실제 이미지가 없을 때)
const getPlaceholderImage = (index: number) => {
  // Unsplash 또는 다른 placeholder 서비스 사용
  return `https://picsum.photos/640/360?random=${index}`;
};

export const mockBJs: BJ[] = [
  {
    id: "bj-1",
    name: "엑셀황제",
    platform: "youtube",
    isLive: true,
    currentScore: 128500,
    thumbnailUrl: getPlaceholderImage(1),
    channelUrl: "https://www.youtube.com/@excelking",
    streamUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw", // 테스트용 URL (실제 API가 작동하면 사용되지 않음)
  },
  {
    id: "bj-2",
    name: "골드여신",
    platform: "soop",
    isLive: true,
    currentScore: 98500,
    thumbnailUrl: getPlaceholderImage(2),
    channelUrl: "https://bjafree.soop.com/goldgoddess",
    streamUrl: "https://play.afreecatv.com/goldgoddess/123456",
  },
  {
    id: "bj-3",
    name: "판다의신",
    platform: "youtube",
    isLive: false,
    currentScore: 75400,
    thumbnailUrl: getPlaceholderImage(3),
    channelUrl: "https://www.pandalive.co.kr/pandagod",
  },
  {
    id: "bj-4",
    name: "실시간매니아",
    platform: "youtube",
    isLive: true,
    currentScore: 64200,
    thumbnailUrl: getPlaceholderImage(4),
    channelUrl: "https://www.youtube.com/@realtime",
    streamUrl: "https://www.youtube.com/watch?v=O6Dh1Q_5vLk",
  },
  {
    id: "bj-5",
    name: "엑셀장인",
    platform: "soop",
    isLive: true,
    currentScore: 51200,
    thumbnailUrl: getPlaceholderImage(5),
    channelUrl: "https://play.afreecatv.com/excelmaster",
    streamUrl: "https://play.afreecatv.com/excelmaster/987654",
  },
];

export const mockRanking: RankingEntry[] = mockBJs
  .map<RankingEntry>((bj, index) => ({
    rank: index + 1,
    bj,
    viewerCount: 1000 * (mockBJs.length - index), // 시청자수 기반
    diffFromYesterday: index === 0 ? 1 : index === 1 ? 0 : -index,
  }))
  .sort((a, b) => a.rank - b.rank);

export const mockLives: LiveEntry[] = mockBJs
  .filter((bj) => bj.isLive)
  .map<LiveEntry>((bj, index) => ({
    bj,
    title: `${bj.name}의 광기 엑셀 방송 #${index + 1}`,
    viewerCount: 1000 * (mockBJs.length - index),
    startedAt: new Date(Date.now() - (index + 1) * 15 * 60 * 1000).toISOString(),
  }));

