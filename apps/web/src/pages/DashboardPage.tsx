import { useEffect, useState } from "react"
import { apiGet } from "../api/client"
import type { DashboardSummary } from "../types"

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    apiGet<DashboardSummary>("/dashboard/summary").then(setSummary).catch((err) => setError(err.message))
  }, [])

  if (error) {
    return <div className="notice error">{error}</div>
  }

  return (
    <section className="console-grid">
      <div className="metric-strip">
        <Metric label="Active monitors" value={summary?.activeMonitors ?? 0} />
        <Metric label="Today hits" value={summary?.todayHits ?? 0} />
        <Metric label="Risk alerts" value={summary?.riskAlerts ?? 0} tone="risk" />
      </div>

      <div className="panel timeline-panel">
        <div className="panel-header">
          <h2>Live Signal Timeline</h2>
          <span>{summary?.latestNotifications.length ?? 0} events</span>
        </div>
        <div className="timeline">
          {(summary?.latestNotifications ?? []).map((item) => (
            <article key={item.id} className="timeline-item">
              <div className={`pulse ${item.type === "risk_alert" ? "risk" : ""}`} />
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                {item.relatedItem && (
                  <a className="article-link" href={item.relatedItem.url} target="_blank" rel="noreferrer">
                    {item.relatedItem.title}
                  </a>
                )}
                <small>
                  {item.channel} / {item.status}
                </small>
              </div>
            </article>
          ))}
          {!summary?.latestNotifications.length && <p className="muted">No signals yet.</p>}
        </div>
      </div>

      <aside className="panel signal-rail">
        <div className="panel-header">
          <h2>Source Rail</h2>
        </div>
        {(summary?.sources ?? []).map((source) => (
          <div key={source.id} className="source-row">
            <span className={source.enabled ? "dot online" : "dot"} />
            <div>
              <strong>{source.name}</strong>
              <small>
                {source.type} / weight {source.weight}
              </small>
            </div>
          </div>
        ))}
        {!summary?.sources.length && <p className="muted">Add or seed sources to start collecting.</p>}
      </aside>

      <div className="panel trend-band">
        <div className="panel-header">
          <h2>Latest Hot Topics</h2>
        </div>
        <div className="trend-list">
          {(summary?.latestTrends ?? []).map((trend) => (
            <article key={trend.id} className="trend-row">
              <div className="score">{Math.round(trend.hotScore)}</div>
              <div>
                <strong>{trend.title}</strong>
                <p>{trend.summary}</p>
              </div>
            </article>
          ))}
          {!summary?.latestTrends.length && <p className="muted">No trend topics discovered yet.</p>}
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "risk" }) {
  return (
    <div className={tone === "risk" ? "metric risk" : "metric"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

