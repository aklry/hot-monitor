import type { CollectedCandidate } from "@hots-monitor/shared"

export interface SourceAdapter {
  readonly type: string
  search(query: string): Promise<CollectedCandidate[]>
}
