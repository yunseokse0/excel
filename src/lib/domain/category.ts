/**
 * This rule engine is designed to support
 * multiple live content categories.
 * 'Excel Live' is the first production category.
 * 
 * The system is architected as a platform that can
 * manage multiple categories with their own rules,
 * rather than a single-purpose fan page.
 */

/**
 * Category matching rule configuration.
 * Each category can define include/exclude patterns
 * to match live streams.
 */
export type CategoryRule = {
  /** Unique identifier for the category */
  id: string;
  /** Display name for the category */
  name: string;
  /** Keywords/patterns that must be present (at least one) */
  include: string[];
  /** Keywords/patterns that exclude from this category */
  exclude: string[];
  /** Priority for matching (higher = more important) */
  priority: number;
  /** Whether this category is currently enabled */
  enabled: boolean;
};

/**
 * Result of category matching for a live stream.
 */
export type DetectedCategory = {
  /** Category ID that matched */
  categoryId: string;
  /** Confidence score (0-1, higher = more confident) */
  score: number;
};

/**
 * Match a text against category rules.
 * Returns all matching categories with confidence scores.
 */
export function matchCategories(
  text: string,
  rules: CategoryRule[]
): DetectedCategory[] {
  const matches: DetectedCategory[] = [];
  const lowerText = text.toLowerCase();

  for (const rule of rules) {
    if (!rule.enabled) continue;

    // Check if any include pattern matches
    const hasIncludeMatch = rule.include.some((pattern) => {
      const regex = new RegExp(pattern, "i");
      return regex.test(lowerText);
    });

    if (!hasIncludeMatch) continue;

    // Check if any exclude pattern matches
    const hasExcludeMatch = rule.exclude.some((pattern) => {
      const regex = new RegExp(pattern, "i");
      return regex.test(lowerText);
    });

    if (hasExcludeMatch) continue;

    // Calculate confidence score
    // Higher score if multiple include patterns match
    const matchingIncludes = rule.include.filter((pattern) => {
      const regex = new RegExp(pattern, "i");
      return regex.test(lowerText);
    }).length;

    const score = Math.min(
      0.5 + (matchingIncludes / rule.include.length) * 0.5,
      1.0
    );

    matches.push({
      categoryId: rule.id,
      score: score * (rule.priority / 10), // Normalize priority
    });
  }

  // Sort by score (descending)
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Get the primary category (highest score) from detected categories.
 */
export function getPrimaryCategory(
  detectedCategories: DetectedCategory[]
): string | null {
  if (detectedCategories.length === 0) return null;
  return detectedCategories[0].categoryId;
}
