export interface TrendScoreInput {
  aiHotScore: number
  sourceCount: number
  averageSourceWeight: number
  newestItemAgeHours: number
}

export function calculateTrendScore(input: TrendScoreInput): number {
  const sourceCountScore = Math.min(input.sourceCount * 12, 30)
  const sourceWeightScore = Math.min(Math.max(input.averageSourceWeight, 0), 100) * 0.2
  const freshnessScore = Math.max(0, 30 - input.newestItemAgeHours * 1.25)
  const aiScore = Math.min(Math.max(input.aiHotScore, 0), 100) * 0.2

  return Math.round(Math.min(100, sourceCountScore + sourceWeightScore + freshnessScore + aiScore))
}
