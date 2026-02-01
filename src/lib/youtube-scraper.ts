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
    console.log(`[YouTube Scraper] 📡 URL: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com',
      },
    });

    if (!response.ok) {
      console.error(`[YouTube Scraper] ❌ Failed to fetch: ${response.status} ${response.statusText}`);
      const text = await response.text().catch(() => '');
      console.error(`[YouTube Scraper] Response preview: ${text.substring(0, 200)}`);
      return [];
    }

    const html = await response.text();
    console.log(`[YouTube Scraper] 📄 HTML length: ${html.length} bytes`);
    
    if (html.length < 1000) {
      console.warn(`[YouTube Scraper] ⚠️ HTML too short, might be blocked`);
      return [];
    }
    
    // 여러 패턴으로 ytInitialData 찾기
    let ytInitialData: any = null;
    
    // 패턴 1: var ytInitialData = {...};
    let match = html.match(/var ytInitialData\s*=\s*({[\s\S]+?});/);
    if (match && match[1]) {
      try {
        ytInitialData = JSON.parse(match[1]);
        console.log(`[YouTube Scraper] ✅ Found ytInitialData (pattern 1)`);
      } catch (e) {
        console.warn(`[YouTube Scraper] ⚠️ Failed to parse pattern 1:`, e);
      }
    }
    
    // 패턴 2: window["ytInitialData"] = {...};
    if (!ytInitialData) {
      match = html.match(/window\["ytInitialData"\]\s*=\s*({[\s\S]+?});/);
      if (match && match[1]) {
        try {
          ytInitialData = JSON.parse(match[1]);
          console.log(`[YouTube Scraper] ✅ Found ytInitialData (pattern 2)`);
        } catch (e) {
          console.warn(`[YouTube Scraper] ⚠️ Failed to parse pattern 2:`, e);
        }
      }
    }
    
    // 패턴 3: <script> 태그 내부
    if (!ytInitialData) {
      const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      for (const scriptMatch of scriptMatches) {
        const scriptContent = scriptMatch[1];
        match = scriptContent.match(/var ytInitialData\s*=\s*({[\s\S]+?});/);
        if (match && match[1]) {
          try {
            ytInitialData = JSON.parse(match[1]);
            console.log(`[YouTube Scraper] ✅ Found ytInitialData (pattern 3 - script tag)`);
            break;
          } catch (e) {
            // Continue searching
          }
        }
      }
    }
    
    if (!ytInitialData) {
      console.warn(`[YouTube Scraper] ⚠️ Could not find ytInitialData in HTML`);
      console.warn(`[YouTube Scraper] HTML preview (first 500 chars): ${html.substring(0, 500)}`);
      return [];
    }

    try {
      // 여러 경로로 비디오 데이터 찾기
      const videos: YouTubeScrapedLive[] = [];
      
      // 경로 1: twoColumnSearchResultsRenderer
      let contents = ytInitialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
      
      // 경로 2: 직접 contents
      if (contents.length === 0) {
        contents = ytInitialData?.contents || [];
      }
      
      // 경로 3: onResponseReceivedCommands
      if (contents.length === 0) {
        const commands = ytInitialData?.onResponseReceivedCommands || [];
        for (const cmd of commands) {
          if (cmd?.appendContinuationItemsAction?.items) {
            contents.push(...cmd.appendContinuationItemsAction.items);
          }
        }
      }

      console.log(`[YouTube Scraper] 📊 Found ${contents.length} content sections`);

      for (const section of contents) {
        // itemSectionRenderer 경로
        const itemSection = section?.itemSectionRenderer?.contents || [];
        
        // videoRenderer 직접 경로
        const directVideo = section?.videoRenderer;
        
        const items = directVideo ? [directVideo] : itemSection;
        
        for (const item of items) {
          const videoRenderer = item?.videoRenderer || item;
          if (!videoRenderer || !videoRenderer.videoId) continue;

          // 라이브 방송 필터링 - 여러 방법 시도
          let isLive = false;
          
          // 방법 1: badges 확인
          const badges = videoRenderer.badges || [];
          isLive = badges.some((badge: any) => 
            badge?.metadataBadgeRenderer?.label === 'LIVE' ||
            badge?.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW' ||
            badge?.liveBadgeRenderer
          );
          
          // 방법 2: lengthText 확인 (라이브는 "시청 중" 같은 텍스트)
          if (!isLive && videoRenderer.lengthText) {
            const lengthText = videoRenderer.lengthText?.simpleText || videoRenderer.lengthText?.runs?.[0]?.text || '';
            isLive = lengthText.includes('시청') || lengthText.includes('LIVE') || lengthText === '';
          }
          
          // 방법 3: thumbnailOverlays 확인
          if (!isLive && videoRenderer.thumbnailOverlays) {
            isLive = videoRenderer.thumbnailOverlays.some((overlay: any) => 
              overlay?.thumbnailOverlayTimeStatusRenderer?.style === 'LIVE'
            );
          }

          if (!isLive) continue;

          const videoId = videoRenderer.videoId;
          const title = videoRenderer.title?.runs?.[0]?.text || 
                       videoRenderer.title?.simpleText || 
                       videoRenderer.title?.accessibility?.accessibilityData?.label || 
                       '';
          const channelTitle = videoRenderer.ownerText?.runs?.[0]?.text || 
                             videoRenderer.ownerText?.simpleText || 
                             videoRenderer.channelTitle?.simpleText || 
                             '';
          const channelId = videoRenderer.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || 
                          videoRenderer.channelId || 
                          videoRenderer.navigationEndpoint?.browseEndpoint?.browseId || 
                          '';
          
          // 썸네일 URL 추출
          let thumbnailUrl = '';
          if (videoRenderer.thumbnail?.thumbnails?.length > 0) {
            const thumbnails = videoRenderer.thumbnail.thumbnails;
            thumbnailUrl = thumbnails[thumbnails.length - 1]?.url || thumbnails[0]?.url || '';
          }
          
          // 시청자 수 추출
          const viewCountText = videoRenderer.viewCountText?.runs?.[0]?.text || 
                               videoRenderer.viewCountText?.simpleText || 
                               '';
          const viewerCount = parseViewerCount(viewCountText);

          if (videoId && title) {
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
      }

      console.log(`[YouTube Scraper] ✅ Found ${videos.length} live streams`);
      if (videos.length > 0) {
        console.log(`[YouTube Scraper] Sample: ${videos[0].title} by ${videos[0].channelTitle}`);
      }
      return videos;
    } catch (parseError) {
      console.error(`[YouTube Scraper] ❌ Failed to parse ytInitialData:`, parseError);
      if (parseError instanceof Error) {
        console.error(`[YouTube Scraper] Error message:`, parseError.message);
      }
      return [];
    }
  } catch (error) {
    console.error(`[YouTube Scraper] ❌ Error:`, error);
    if (error instanceof Error) {
      console.error(`[YouTube Scraper] Error message:`, error.message);
      console.error(`[YouTube Scraper] Error stack:`, error.stack);
    }
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
