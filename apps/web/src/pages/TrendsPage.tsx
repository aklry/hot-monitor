import { FormEvent, useEffect, useState } from "react"
import { apiGet, apiPost } from "../api/client"
import type { TrendTopic } from "../types"

export function TrendsPage() {
  const [scope, setScope] = useState("ai programming")
  const [trends, setTrends] = useState<TrendTopic[]>([])
  const [message, setMessage] = useState("")

  const load = () => apiGet<TrendTopic[]>(`/trends?scope=${encodeURIComponent(scope)}`).then(setTrends)

  useEffect(() => {
    void load()
  }, [])

  async function run(event: FormEvent) {
    event.preventDefault()
    setMessage("Discovering trends...")
    const result = await apiPost<{ candidates: number; evidence: number }>("/trends/run-now", { scope })
    setMessage(`Scanned ${result.candidates} candidates, saved ${result.evidence} evidence items`)
    await load()
  }

  return (
    <section className="stack">
      <form className="panel form-grid" onSubmit={run}>
        <label>
          Scope
          <input value={scope} onChange={(event) => setScope(event.target.value)} />
        </label>
        <button className="primary">Run radar sweep</button>
      </form>
      {message && <div className="notice">{message}</div>}
      <div className="trend-cards">
        {trends.map((trend) => (
          <article key={trend.id} className="trend-card">
            <div className="score large">{Math.round(trend.hotScore)}</div>
            <div>
              <strong>{trend.title}</strong>
              <p>{trend.summary}</p>
              <small>
                growth {Math.round(trend.growthScore)} / evidence {trend.evidenceCount}
              </small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
