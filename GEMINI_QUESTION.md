# 제미나이에게 질문할 내용

## 문제 상황
Next.js 14 (App Router)를 사용하여 YouTube와 아프리카TV(SOOP)에서 실시간 방송 목록을 가져오는 기능을 구현하고 있습니다. 하지만 실시간 방송 데이터(제목, 시청자 수, 썸네일 등)를 제대로 가져오지 못하고 있습니다.

## 현재 구현 코드

### YouTube API 호출
```typescript
// src/lib/actions/get-live-list.ts
async function fetchYouTubeLiveStreams(): Promise<LiveStreamInfo[]> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("eventType", "live");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "50");
  searchUrl.searchParams.set("order", "viewCount");
  searchUrl.searchParams.set("videoSyndicated", "true");
  searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

  const searchRes = await fetch(searchUrl.toString(), { 
    cache: "no-store",
    next: { revalidate: 0 }
  });
  
  // 검색 결과에서 비디오 ID 추출 후 videos API로 상세 정보 가져오기
  // liveBroadcastContent === "live" 필터링
}
```

### SOOP(아프리카TV) API 호출
```typescript
async function fetchSoopLiveStreams(): Promise<LiveStreamInfo[]> {
  const apiEndpoints = [
    "https://bjapi.afreecatv.com/api/main/broad_list",
    "https://live.afreecatv.com/api/main/broad_list",
    // ...
  ];
  
  // 여러 엔드포인트 시도
  // broad_list에서 ON_AIR 상태 필터링
}
```

## 문제점
1. **중요**: `.env.local` 파일에 `YOUTUBE_API_KEY`가 설정되어 있지 않음 (확인됨)
2. YouTube API에서 검색은 성공하지만 필터링 후 실제 라이브 방송이 0개로 나옴
3. SOOP API 응답 구조를 정확히 알 수 없어 데이터 매핑이 어려움
4. 실시간 방송 제목, 시청자 수, 썸네일 등이 제대로 표시되지 않음

## 발견된 문제
- `.env.local` 파일에 `YOUTUBE_API_KEY` 환경 변수가 설정되어 있지 않음
- 이로 인해 YouTube API 호출이 실패하거나 빈 결과를 반환할 수 있음

## 확인해야 할 사항
1. YouTube Data API v3의 `search` 엔드포인트에서 `eventType=live`로 검색했을 때 실제로 라이브 중인 방송만 반환되는가?
2. `liveBroadcastContent === "live"` 조건만으로 충분한가? 추가로 확인해야 할 필드가 있는가?
3. 아프리카TV의 실제 API 엔드포인트와 응답 구조는 어떻게 되는가?
4. Next.js Server Actions에서 외부 API 호출 시 캐시 문제가 발생할 수 있는가?

## 환경
- Next.js 14 (App Router)
- TypeScript
- Server Actions 사용
- YouTube Data API v3
- 아프리카TV 비공식 API

## 질문
위 문제를 해결하기 위한 가장 효과적인 방법은 무엇인가요? YouTube와 아프리카TV에서 실시간 방송 데이터를 정확하게 가져오려면 어떻게 해야 하나요?
