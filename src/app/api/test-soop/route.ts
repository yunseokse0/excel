import { NextResponse } from "next/server";

/**
 * GET /api/test-soop
 * SOOP API 엔드포인트를 테스트하고 응답 구조를 확인합니다.
 */
export async function GET() {
  const apiEndpoints = [
    "https://live.afreecatv.com/afreeca/player_live_api.php?bjid=&type=live&page=1&per_page=50",
    "https://live.afreecatv.com/api/main/broad_list",
    "https://bjapi.afreecatv.com/api/main/broad_list",
    "https://live.afreecatv.com/afreeca/live_list.php",
    "https://bj.afreecatv.com/api/main/broad_list",
    "https://st.afreecatv.com/api/main/broad_list",
    "https://api.afreecatv.com/api/main/broad_list",
  ];

  const results: any[] = [];

  for (const apiUrl of apiEndpoints) {
    try {
      console.log(`[Test] Trying: ${apiUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          "Referer": "https://www.afreecatv.com/",
          "Origin": "https://www.afreecatv.com",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get("content-type") || "";
      const responseText = await res.text();

      results.push({
        url: apiUrl,
        status: res.status,
        statusText: res.statusText,
        contentType,
        hasJson: contentType.includes("json"),
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 500),
        error: null,
      });

      // JSON 파싱 시도
      if (contentType.includes("json")) {
        try {
          const data = JSON.parse(responseText);
          results[results.length - 1].parsedData = {
            keys: Object.keys(data),
            isArray: Array.isArray(data),
            firstItemKeys: Array.isArray(data) && data[0] ? Object.keys(data[0]) : null,
            sample: JSON.stringify(data).substring(0, 1000),
          };
        } catch (e) {
          results[results.length - 1].parseError = String(e);
        }
      }
    } catch (error) {
      results.push({
        url: apiUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({
    success: true,
    results,
    message: "SOOP API 엔드포인트 테스트 결과",
  });
}
