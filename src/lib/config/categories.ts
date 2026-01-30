/**
 * Default category configuration.
 * 
 * This file defines the default categories available in the platform.
 * Categories can be managed via the admin interface or database.
 * 
 * The 'excel-live' category is the first production category,
 * but the system is designed to support multiple categories.
 */

import type { CategoryRule } from "../domain/category";

/**
 * Default category ID for the first production category.
 * This is used as a fallback when no category is specified.
 */
export const DEFAULT_CATEGORY_ID = "excel-live";

/**
 * Default category rules.
 * These rules define how live streams are matched to categories.
 */
export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
  {
    id: "excel-live",
    name: "Excel Live",
    include: [
      "엑셀.*방송|방송.*엑셀",
      "엑셀.*라이브|라이브.*엑셀",
      "엑셀.*생방송|생방송.*엑셀",
      "엑셀.*방송중|방송중.*엑셀",
      "엑셀.*방송.*중|방송.*중.*엑셀",
      "엑셀.*스트리밍|스트리밍.*엑셀",
      "^.*엑셀.*방송.*$",
    ],
    exclude: [
      "내일.*엑셀|엑셀.*내일",
      "내일의.*엑셀|엑셀.*내일의",
      "엑셀.*일정|일정.*엑셀",
      "엑셀.*스케줄|스케줄.*엑셀",
      "엑셀.*뉴스|뉴스.*엑셀",
      "엑셀.*방송.*일정|방송.*일정.*엑셀",
      "오늘.*엑셀.*일정|엑셀.*오늘.*일정",
      "엑셀.*강의|강의.*엑셀",
      "엑셀.*실습|실습.*엑셀",
      "엑셀.*함수|함수.*엑셀",
      "엑셀.*배우기|배우기.*엑셀",
      "엑셀.*튜토리얼|튜토리얼.*엑셀",
      "엑셀.*교육|교육.*엑셀",
      "엑셀.*공부|공부.*엑셀",
      "엑셀.*기초|기초.*엑셀",
      "엑셀.*활용|활용.*엑셀",
      "엑셀.*팁|팁.*엑셀",
      "excel.*tutorial|tutorial.*excel",
      "excel.*lesson|lesson.*excel",
      "excel.*learn|learn.*excel",
      "excel.*how.*to|how.*to.*excel",
      // 뉴스 채널 제외
      ".*뉴스.*채널|.*news.*channel",
      "YTN|MBC.*뉴스|SBS.*뉴스|KBS.*뉴스|JTBC.*뉴스|채널A.*뉴스|TV조선.*뉴스",
      ".*24.*시간.*뉴스|.*24.*hour.*news",
      ".*뉴스.*24|.*news.*24",
      ".*뉴스.*방송|.*news.*broadcast",
      ".*뉴스.*라이브|.*news.*live",
    ],
    priority: 10,
    enabled: true,
  },
  // Future categories can be added here:
  // {
  //   id: "powerpoint-live",
  //   name: "PowerPoint Live",
  //   include: ["파워포인트.*방송", "ppt.*live"],
  //   exclude: ["파워포인트.*강의"],
  //   priority: 9,
  //   enabled: false,
  // },
];

/**
 * Get active category rules.
 * In the future, this can fetch from database or admin settings.
 */
export function getActiveCategoryRules(): CategoryRule[] {
  return DEFAULT_CATEGORY_RULES.filter((rule) => rule.enabled);
}

/**
 * Get category rule by ID.
 */
export function getCategoryRuleById(id: string): CategoryRule | undefined {
  return DEFAULT_CATEGORY_RULES.find((rule) => rule.id === id);
}
