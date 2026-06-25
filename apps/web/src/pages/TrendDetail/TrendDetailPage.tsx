import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { ArrowLeft, ExternalLink, TrendingUp, FileText, Clock } from "lucide-react"
import { apiGet } from "$/api/client"
import type { TrendDetail } from "$/types"
import "./TrendDetailPage.css"

export function TrendDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [trend, setTrend] = useState<TrendDetail | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) {
      setStatus("error")
      setError("Trend id is missing")
      return
    }

    let ignore = false
    setStatus("loading")
    setError("")

    apiGet<TrendDetail>(`/trends/${encodeURIComponent(id)}`)
      .then((result) => {
        if (!ignore) {
          setTrend(result)
          setStatus("ready")
        }
      })
      .catch((caught: unknown) => {
        if (!ignore) {
          setError(caught instanceof Error ? caught.message : "Unable to load trend")
          setStatus("error")
        }
      })

    return () => {
      ignore = true
    }
  }, [id])

  if (status === "loading") {
    return <div className="notice">正在加载趋势详情…</div>
  }

  if (status === "error" || !trend) {
    return (
      <div className="detail-page">
        <Link className="detail-back-btn" to="/trends">
          <ArrowLeft size={16} /> 返回趋势列表
        </Link>
        <div className="notice error">{error || "未找到该趋势"}</div>
      </div>
    )
  }

  return (
    <div className="detail-page">
      {/* Back button */}
      <Link className="detail-back-btn" to="/trends">
        <ArrowLeft size={16} /> 返回趋势列表
      </Link>

      {/* Hero card */}
      <div className="detail-hero">
        <div>
          {trend.scope && <p className="eyebrow">{trend.scope}</p>}
          <h2 className="detail-hero-title">{trend.title}</h2>
        </div>

        {trend.summary && (
          <p className="detail-hero-summary">{trend.summary}</p>
        )}

        {/* Meta chips */}
        <div className="detail-meta-row">
          {trend.hotScore != null && (
            <div className="detail-meta-chip">
              <TrendingUp size={14} />
              热度 {Math.round(trend.hotScore)}
            </div>
          )}
          {trend.growthScore != null && (
            <div className="detail-meta-chip">
              <TrendingUp size={14} />
              增长 {Math.round(trend.growthScore)}
            </div>
          )}
          {trend.evidenceCount != null && (
            <div className="detail-meta-chip">
              <FileText size={14} />
              {trend.evidenceCount} 条证据
            </div>
          )}
          {trend.lastSeenAt && (
            <div className="detail-meta-chip">
              <Clock size={14} />
              {formatDate(trend.lastSeenAt)}
            </div>
          )}
        </div>
      </div>

      {/* Evidence section */}
      <div className="detail-section">
        <h3 className="detail-section-title">相关证据</h3>
        {trend.evidences.map((evidence) => (
          <article key={evidence.id} className="evidence-card">
            <h4 className="evidence-card-title">
              <a href={evidence.item.url} target="_blank" rel="noreferrer">
                {evidence.item.title}
                <ExternalLink size={14} style={{ verticalAlign: "middle", marginLeft: 4 }} />
              </a>
            </h4>
            {evidence.item.summary && (
              <p className="evidence-card-summary">{evidence.item.summary}</p>
            )}
            {evidence.aiReason && (
              <p className="evidence-card-reason">{evidence.aiReason}</p>
            )}
            <div className="evidence-card-meta">
              <span className="source-badge">{evidence.item.source.name}</span>
              {evidence.item.author && (
                <span className="source-badge">{evidence.item.author}</span>
              )}
              {evidence.item.publishedAt && (
                <span className="time-label">{formatDate(evidence.item.publishedAt)}</span>
              )}
              {evidence.sourceWeight != null && (
                <span className="detail-meta-chip evidence-weight-chip">
                  权重 {evidence.sourceWeight}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value))
}
