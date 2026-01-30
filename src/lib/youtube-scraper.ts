/**
 * YouTube API 할당량 우회를 위한 웹 스크래핑 유틸리티
 * YouTube Data API v3 대신 웹 페이지에서 직접 데이터를 가져옵니다.
 * 
 * 주의: YouTube ToS를 준수해야 하며, 과도한 요청은 IP 차단될 수 있습니다.
 */

export interface YouTubeScrapedLive {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string;
  viewerCount?: number;
  publishedAt?: string;
}

/**
 * YouTube 검색 페이지에서 라이브 방송을 스크래핑합니다.
 * @param query 검색어 (예: "엑셀 방송")
 * @returns 라이브 방송 목록
 */
export async function scrapeYouTubeLiveSearch(query: string): Promise<YouTubeScrapedLive[]> {
  try {
    // YouTube 검색 URL (라이브 필터)
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgJAAQ%253D%253D`;
    
    console.log(`[YouTube Scraper] 🔍 Searching for: "${query}"`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      console.error(`[YouTube Scraper] ❌ Failed to fetch: ${response.status}`);
      return [];
    }

    const html = await response.text();
    
    // YouTube는 초기 HTML에 JSON 데이터를 포함합니다
    // var ytInitialData = {...} 패턴 찾기
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
    
    if (!ytInitialDataMatch) {
      console.warn(`[YouTube Scraper] ⚠️ Could not find ytInitialData in HTML`);
      return [];
    }

    try {
      const ytInitialData = JSON.parse(ytInitialDataMatch[1]);
      
      // 라이브 방송 정보 추출
      const contents = ytInitialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
      const videos: YouTubeScrapedLive[] = [];

      for (const section of contents) {
        const itemSection = section?.itemSectionRenderer?.contents || [];
        
        for (const item of itemSection) {
          const videoRenderer = item?.videoRenderer;
          if (!videoRenderer) continue;

          // 라이브 방송만 필터링
          const badges = videoRenderer.badges || [];
          const isLive = badges.some((badge: any) => 
            badge.metadataBadgeRenderer?.label === 'LIVE' ||
            badge.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW'
          );

          if (!isLive) continue;

          const videoId = videoRenderer.videoId;
          const title = videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.simpleText || '';
          const channelTitle = videoRenderer.ownerText?.runs?.[0]?.text || '';
          const channelId = videoRenderer.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '';
          const thumbnailUrl = videoRenderer.thumbnail?.thumbnails?.[videoRenderer.thumbnail.thumbnails.length - 1]?.url || '';
          
          // 시청자 수 추출 (있는 경우)
          const viewCountText = videoRenderer.viewCountText?.runs?.[0]?.text || '';
          const viewerCount = parseViewerCount(viewCountText);

          videos.push({
            videoId,
            title,
            channelTitle,
            channelId,
            thumbnailUrl,
            viewerCount,
          });
        }
      }

      console.log(`[YouTube Scraper] ✅ Found ${videos.length} live streams`);
      return videos;
    } catch (parseError) {
      console.error(`[YouTube Scraper] ❌ Failed to parse ytInitialData:`, parseError);
      return [];
    }
  } catch (error) {
    console.error(`[YouTube Scraper] ❌ Error:`, error);
    return [];
  }
}

/**
 * 시청자 수 텍스트를 숫자로 변환
 * 예: "1.2천 명 시청" -> 1200
 */
function parseViewerCount(text: string): number | undefined {
  if (!text) return undefined;
  
  const match = text.match(/([\d.]+)\s*(천|만|억)?/);
  if (!match) return undefined;

  const number = parseFloat(match[1]);
  const unit = match[2];

  if (unit === '천') return Math.round(number * 1000);
  if (unit === '만') return Math.round(number * 10000);
  if (unit === '억') return Math.round(number * 100000000);
  
  return Math.round(number);
}

/**
 * YouTube RSS 피드를 사용하여 채널의 최신 비디오를 가져옵니다.
 * RSS는 할당량이 없지만 라이브 필터링은 불가능합니다.
 * @param channelId 채널 ID (예: "UC..." 또는 "@username")
 * @returns 최신 비디오 목록
 */
export async function getYouTubeChannelRSS(channelId: string): Promise<YouTubeScrapedLive[]> {
  try {
    // 채널 ID 정규화
    let rssUrl: string;
    if (channelId.startsWith('@')) {
      // @username 형식
      const username = channelId.slice(1);
      rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${username}`;
    } else if (channelId.startsWith('UC')) {
      // 채널 ID 형식
      rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    } else {
      console.warn(`[YouTube RSS] ⚠️ Invalid channel ID format: ${channelId}`);
      return [];
    }

    console.log(`[YouTube RSS] 🔍 Fetching RSS for channel: ${channelId}`);
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`[YouTube RSS] ❌ Failed to fetch: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    
    // XML 파싱 (간단한 정규식 사용, 실제로는 XML 파서 사용 권장)
    const videoMatches = xml.matchAll(/<entry>[\s\S]*?<\/entry>/g);
    const videos: YouTubeScrapedLive[] = [];

    for (const match of videoMatches) {
      const entry = match[0];
      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
      const authorMatch = entry.match(/<name>([^<]+)<\/name>/);
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
      const thumbnailMatch = entry.match(/<media:thumbnail[^>]+url="([^"]+)"/);

      if (videoIdMatch) {
        videos.push({
          videoId: videoIdMatch[1],
          title: titleMatch?.[1] || '',
          channelTitle: authorMatch?.[1] || '',
          channelId: channelId,
          thumbnailUrl: thumbnailMatch?.[1] || '',
          publishedAt: publishedMatch?.[1],
        });
      }
    }

    console.log(`[YouTube RSS] ✅ Found ${videos.length} videos`);
    return videos;
  } catch (error) {
    console.error(`[YouTube RSS] ❌ Error:`, error);
    return [];
  }
}
