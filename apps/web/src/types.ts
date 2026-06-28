export interface DashboardSummary {
  activeMonitors: number
  todayHits: number
  riskAlerts: number
  latestTrends: TrendTopic[]
  latestNotifications: NotificationRecord[]
  sources: SourceRecord[]
}

export interface MonitorKeyword {
  id: string
  keyword: string
  scope: string
  enabled: boolean
  checkIntervalMinutes: number
  lastCheckedAt?: string
}

export interface TrendTopic {
  id: string
  scope: string
  title: string
  summary: string
  hotScore: number
  growthScore: number
  status?: "new" | "surging" | "watching" | "cooling"
  evidenceCount: number
  firstSeenAt?: string
  lastSeenAt: string
  snapshots?: TrendSnapshot[]
}

export interface TrendDetail extends TrendTopic {
  firstSeenAt: string
  snapshots: TrendSnapshot[]
  evidences: TrendEvidence[]
}

export interface TrendSnapshot {
  id: string
  hotScore?: number
  growthScore?: number
  evidenceCount?: number
  sourceCount?: number
  status?: string
  capturedAt?: string
}

export interface TrendEvidence {
  id: string
  aiReason?: string | null
  sourceWeight: number
  item: TrendEvidenceItem
}

export interface TrendEvidenceItem {
  id: string
  title: string
  url: string
  summary?: string | null
  content?: string | null
  author?: string | null
  publishedAt?: string | null
  source: SourceRecord
}
export interface SourceRecord {
  id: string
  name: string
  type: string
  url?: string
  enabled: boolean
  weight: number
}

export interface NotificationItem {
  id: string
  title: string
  url: string
  summary?: string
  content?: string
  author?: string
  publishedAt?: string
}

export interface NotificationRecord {
  id: string
  type: string
  title: string
  message: string
  channel: string
  status: string
  createdAt: string
  error?: string
  batchId?: string
  relatedItem?: NotificationItem | null
}
