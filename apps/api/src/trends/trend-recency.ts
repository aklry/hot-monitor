import type { CollectedCandidate } from "@hots-monitor/shared"

export const TREND_RECENCY_WINDOW_DAYS = 30
export const TREND_RECENCY_WINDOW_HOURS = TREND_RECENCY_WINDOW_DAYS * 24

export interface TrendRecencyResult {
  candidates: CollectedCandidate[]
  recentDatedCount: number
}

function publishedAgeHours(candidate: CollectedCandidate, now: Date): number | undefined {
  if (!candidate.publishedAt) {
    return undefined
  }

  const publishedAt = new Date(candidate.publishedAt)
  const timestamp = publishedAt.getTime()
  if (Number.isNaN(timestamp)) {
    return undefined
  }

  return (now.getTime() - timestamp) / 36e5
}

export function filterCurrentTrendCandidates(
  candidates: CollectedCandidate[],
  now = new Date()
): TrendRecencyResult {
  let recentDatedCount = 0
  const currentCandidates = candidates.filter((candidate) => {
    const ageHours = publishedAgeHours(candidate, now)
    if (ageHours === undefined) {
      return true
    }

    const isRecent = ageHours >= 0 && ageHours <= TREND_RECENCY_WINDOW_HOURS
    if (isRecent) {
      recentDatedCount += 1
    }
    return isRecent
  })

  return { candidates: currentCandidates, recentDatedCount }
}

export function hasCurrentTrendEvidence(
  candidates: CollectedCandidate[],
  now = new Date()
): boolean {
  return filterCurrentTrendCandidates(candidates, now).recentDatedCount > 0
}
