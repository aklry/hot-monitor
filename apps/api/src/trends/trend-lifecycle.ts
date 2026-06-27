export type TrendLifecycleStatus = "new" | "surging" | "watching" | "cooling"

export interface TrendIdentity {
  id: string
  scope: string
  title: string
}

export interface TrendStatusInput {
  previousHotScore?: number
  hotScore: number
  growthScore: number
  firstSeenAt: Date
  lastSeenAt: Date
  now: Date
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "in",
  "into",
  "of",
  "on",
  "the",
  "to",
  "with"
])

export function findMatchingTrend<T extends TrendIdentity>(
  trends: T[],
  title: string,
  threshold = 0.5
): T | null {
  const titleTokens = tokenizeTitle(title)
  let best: { trend: T; score: number } | null = null

  for (const trend of trends) {
    const score = tokenSimilarity(titleTokens, tokenizeTitle(trend.title))
    if (!best || score > best.score) {
      best = { trend, score }
    }
  }

  return best && best.score >= threshold ? best.trend : null
}

export function resolveTrendStatus(input: TrendStatusInput): TrendLifecycleStatus {
  const ageHours = Math.max(0, (input.now.getTime() - input.firstSeenAt.getTime()) / 36e5)
  const previousHotScore = input.previousHotScore ?? input.hotScore
  const hotDelta = input.hotScore - previousHotScore

  if (ageHours <= 24) {
    return "new"
  }

  if (input.growthScore >= 60 || hotDelta >= 15) {
    return "surging"
  }

  if (input.growthScore <= 20 && hotDelta <= -15) {
    return "cooling"
  }

  return "watching"
}

function tokenizeTitle(title: string): Set<string> {
  const tokens = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ")
    .split(/\s+/)
    .map(token => singularize(token.trim()))
    .filter(token => token.length >= 2 && !STOP_WORDS.has(token))

  return new Set(tokens)
}

function singularize(token: string) {
  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`
  }
  if (token.endsWith("s") && token.length > 3) {
    return token.slice(0, -1)
  }
  return token
}

function tokenSimilarity(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) {
    return 0
  }

  let intersection = 0
  for (const token of left) {
    if (right.has(token)) {
      intersection += 1
    }
  }

  return intersection / Math.min(left.size, right.size)
}
