import { FormEvent, useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import { Layers, TrendingUp, Activity, Radar } from "lucide-react"
import { apiGet, apiPost } from "$/api/client"
import type { TrendTopic } from "$/types"
import "./TrendsPage.css"

type FilterKey = "all" | "high" | "recent"

type StoredTrendState = {
  scope: string
  filter: FilterKey
  trends: TrendTopic[]
}

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "全部" },
  { key: "high", label: "高热度" },
  { key: "recent", label: "最近更新" }
]

const DEFAULT_SCOPE = "ai programming"
const STORAGE_KEY = "trends-page-state"

function readStoredState(): StoredTrendState | null {
  if (typeof window === "undefined") {
    return null
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredTrendState>
    if (
      typeof parsed.scope === "string" &&
      (parsed.filter === "all" || parsed.filter === "high" || parsed.filter === "recent") &&
      Array.isArray(parsed.trends)
    ) {
      return {
        scope: parsed.scope,
        filter: parsed.filter,
        trends: parsed.trends as TrendTopic[]
      }
    }
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY)
  }

  return null
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "刚刚"
  if (mins < 60) return `${mins} 分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} 小时前`
  const days = Math.floor(hrs / 24)
  return `${days} 天前`
}

export function TrendsPage() {
  const storedState = readStoredState()
  const [scope, setScope] = useState(storedState?.scope ?? DEFAULT_SCOPE)
  const [trends, setTrends] = useState<TrendTopic[]>(storedState?.trends ?? [])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(!storedState)
  const [filter, setFilter] = useState<FilterKey>(storedState?.filter ?? "all")

  async function load(nextScope: string) {
    setLoading(true)
    try {
      const result = await apiGet<TrendTopic[]>(`/trends?scope=${encodeURIComponent(nextScope)}`)
      setTrends(result)
      return result
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!storedState) {
      void load(DEFAULT_SCOPE)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const state: StoredTrendState = { scope, filter, trends }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [filter, scope, trends])

  async function run(event: FormEvent) {
    event.preventDefault()
    setMessage("正在扫描趋势…")
    const result = await apiPost<{ candidates: number; evidence: number }>("/trends/run-now", {
      scope
    })
    setMessage(`扫描完成：${result.candidates} 个候选，${result.evidence} 条证据`)
    await load(scope)
  }

  const filtered = useMemo(() => {
    if (filter === "high") {
      return trends.filter((trend) => trend.hotScore >= 70)
    }
    if (filter === "recent") {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000
      return trends.filter((trend) => new Date(trend.lastSeenAt).getTime() >= cutoff)
    }
    return trends
  }, [filter, trends])

  const highCount = useMemo(() => trends.filter((trend) => trend.hotScore >= 70).length, [trends])

  const recentCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    return trends.filter((trend) => new Date(trend.lastSeenAt).getTime() >= cutoff).length
  }, [trends])

  if (loading) {
    return <div className="notice">正在加载趋势数据…</div>
  }

  return (
    <div className="trends-page">
      <form className="trends-filters" onSubmit={run}>
        <label className="trends-scope-label">
          <span>监控范围</span>
          <input
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            placeholder="输入关键词…"
          />
        </label>
        <button className="primary trends-scan-btn" type="submit">
          扫描趋势
        </button>
      </form>

      {message && <div className="notice">{message}</div>}

      <div className="trends-filters">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`filter-pill${filter === item.key ? " active" : ""}`}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="trends-stats">
        <div className="trends-stat">
          <div className="trends-stat-icon">
            <Layers size={18} />
          </div>
          <div>
            <div className="trends-stat-value">{trends.length}</div>
            <div className="trends-stat-label">趋势总数</div>
          </div>
        </div>
        <div className="trends-stat">
          <div className="trends-stat-icon">
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="trends-stat-value">{highCount}</div>
            <div className="trends-stat-label">高热度</div>
          </div>
        </div>
        <div className="trends-stat">
          <div className="trends-stat-icon">
            <Activity size={18} />
          </div>
          <div>
            <div className="trends-stat-value">{recentCount}</div>
            <div className="trends-stat-label">近 24 小时</div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="trends-empty">
          <div className="trends-empty-icon">
            <Radar size={26} />
          </div>
          <p className="trends-empty-title">暂无趋势数据</p>
          <p className="trends-empty-text">请先点击「扫描趋势」来发现当前热点，或调整监控范围。</p>
        </div>
      ) : (
        <div className="trends-grid">
          {filtered.map((trend) => (
            <Link key={trend.id} to={`/trends/${trend.id}`} className="trend-card-modern">
              <div className="trend-card-header">
                <p className="trend-card-title">{trend.title}</p>
                <div className="trend-card-score">{Math.round(trend.hotScore)}</div>
              </div>

              {trend.summary && <p className="trend-card-summary">{trend.summary}</p>}

              <div className="trend-card-meta">
                <span className="detail-meta-chip">
                  <TrendingUp size={12} /> 增长 {Math.round(trend.growthScore)}
                </span>
                <span className="source-badge">{trend.evidenceCount} 条证据</span>
                <span className="time-label">{formatRelativeTime(trend.lastSeenAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
