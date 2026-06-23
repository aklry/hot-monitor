import { FormEvent, useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import { Layers, TrendingUp, Activity, Radar } from "lucide-react"
import { apiGet, apiPost } from "../api/client"
import type { TrendTopic } from "../types"

type FilterKey = "all" | "high" | "recent"

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "全部" },
  { key: "high", label: "高热度" },
  { key: "recent", label: "最近更新" }
]

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
  const [scope, setScope] = useState("ai programming")
  const [trends, setTrends] = useState<TrendTopic[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>("all")

  const load = () =>
    apiGet<TrendTopic[]>(`/trends?scope=${encodeURIComponent(scope)}`).then(setTrends)

  useEffect(() => {
    void load().finally(() => setLoading(false))
  }, [])

  async function run(event: FormEvent) {
    event.preventDefault()
    setMessage("正在扫描趋势…")
    const result = await apiPost<{ candidates: number; evidence: number }>("/trends/run-now", {
      scope
    })
    setMessage(`扫描完成：${result.candidates} 个候选，${result.evidence} 条证据`)
    await load()
  }

  const filtered = useMemo(() => {
    if (filter === "high") {
      return trends.filter((t) => t.hotScore >= 70)
    }
    if (filter === "recent") {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000
      return trends.filter((t) => new Date(t.lastSeenAt).getTime() >= cutoff)
    }
    return trends
  }, [trends, filter])

  const highCount = useMemo(() => trends.filter((t) => t.hotScore >= 70).length, [trends])

  const recentCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    return trends.filter((t) => new Date(t.lastSeenAt).getTime() >= cutoff).length
  }, [trends])

  if (loading) {
    return <div className="notice">正在加载趋势数据…</div>
  }

  return (
    <div className="trends-page">
      {/* Scope input */}
      <form className="trends-filters" onSubmit={run}>
        <label style={{ flex: 1, minWidth: 180 }}>
          <span style={{ fontSize: "0.72rem", color: "#72c7ad", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            监控范围
          </span>
          <input
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="输入关键词…"
            style={{ marginTop: 4 }}
          />
        </label>
        <button className="primary" type="submit" style={{ alignSelf: "flex-end" }}>
          扫描趋势
        </button>
      </form>

      {message && <div className="notice">{message}</div>}

      {/* Filter pills */}
      <div className="trends-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`filter-pill${filter === f.key ? " active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats */}
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

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="trends-empty">
          <div className="trends-empty-icon">
            <Radar size={26} />
          </div>
          <p className="trends-empty-title">暂无趋势数据</p>
          <p className="trends-empty-text">
            请先点击「扫描趋势」来发现当前热点，或调整监控范围。
          </p>
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
                <span className="detail-meta-chip" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>
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
