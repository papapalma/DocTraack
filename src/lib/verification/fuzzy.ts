/**
 * Fuzzy Matching Algorithms: Jaro-Winkler and Levenshtein
 * Native TypeScript implementation with zero external dependencies.
 */

/**
 * Standard Levenshtein edit distance between two strings
 */
export function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Normalized Levenshtein similarity score from 0.0 (no similarity) to 1.0 (identical)
 */
export function levenshteinSimilarity(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(s1, s2);
  return 1.0 - distance / maxLen;
}

/**
 * Jaro-Winkler similarity score from 0.0 to 1.0
 * Excellent for personal names, typos, and minor transpositions.
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;

  // Maximum match distance
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matching characters
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / len1 +
      matches / len2 +
      (matches - transpositions / 2) / matches) /
    3.0;

  // Winkler prefix adjustment (max 4 characters)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  const prefixScale = 0.1;
  return Math.min(1.0, jaro + prefix * prefixScale * (1.0 - jaro));
}

/**
 * Computes comprehensive similarity between two student records
 * Weights: Last Name: 50%, First Name: 40%, Middle Name: 10%
 */
export function computeStudentSimilarity(
  candidate1: { lastName: string; firstName: string; middleName?: string | null },
  candidate2: { lastName: string; firstName: string; middleName?: string | null }
): {
  totalScore: number;
  lastNameScore: number;
  firstNameScore: number;
  middleNameScore: number;
} {
  const lastScore = jaroWinklerSimilarity(
    candidate1.lastName.toUpperCase().trim(),
    candidate2.lastName.toUpperCase().trim()
  );
  const firstScore = jaroWinklerSimilarity(
    candidate1.firstName.toUpperCase().trim(),
    candidate2.firstName.toUpperCase().trim()
  );

  let midScore = 1.0;
  if (candidate1.middleName && candidate2.middleName) {
    const m1 = candidate1.middleName.toUpperCase().trim();
    const m2 = candidate2.middleName.toUpperCase().trim();
    midScore = jaroWinklerSimilarity(m1, m2);
  }

  const totalScore = Math.round((lastScore * 0.5 + firstScore * 0.4 + midScore * 0.1) * 100) / 100;

  return {
    totalScore,
    lastNameScore: Math.round(lastScore * 100) / 100,
    firstNameScore: Math.round(firstScore * 100) / 100,
    middleNameScore: Math.round(midScore * 100) / 100,
  };
}

