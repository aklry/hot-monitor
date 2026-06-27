import { type FormEvent, useEffect, useState } from "react"
import { apiDelete, apiGet, apiPatch, apiPost } from "$/api/client"
import type { MonitorKeyword } from "$/types"
import "./MonitorsPage.css"

export function MonitorsPage() {
  const [monitors, setMonitors] = useState<MonitorKeyword[]>([])
  const [keyword, setKeyword] = useState("")
  const [scope, setScope] = useState("ai programming")
  const [message, setMessage] = useState("")

  const load = () => apiGet<MonitorKeyword[]>("/monitors").then(setMonitors)

  useEffect(() => {
    void load()
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    await apiPost("/monitors", { keyword, scope, checkIntervalMinutes: 10, enabled: true })
    setKeyword("")
    await load()
  }

  async function run(id: string) {
    setMessage("Running monitor...")
    const result = await apiPost<{ candidates: number; analyzed: number; notifications: number }>(
      `/monitors/${id}/run-now`
    )
    setMessage(
      `Candidates ${result.candidates}, analyzed ${result.analyzed}, notifications ${result.notifications}`
    )
  }

  return (
    <section className="monitors-page">
      <form className="panel form-grid" onSubmit={submit}>
        <label>
          Keyword
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} required />
        </label>
        <label>
          Scope
          <input value={scope} onChange={(event) => setScope(event.target.value)} required />
        </label>
        <button className="primary">Add monitor</button>
      </form>

      {message && <div className="notice">{message}</div>}

      <div className="list-panel">
        {monitors.map((monitor) => (
          <article key={monitor.id} className="record-row">
            <div>
              <strong>{monitor.keyword}</strong>
              <p>{monitor.scope}</p>
              <small>Every {monitor.checkIntervalMinutes} minutes</small>
            </div>
            <div className="row-actions">
              <button onClick={() => run(monitor.id)}>Run</button>
              <button
                onClick={async () => {
                  await apiPatch(`/monitors/${monitor.id}`, { enabled: !monitor.enabled })
                  await load()
                }}
              >
                {monitor.enabled ? "Pause" : "Enable"}
              </button>
              <button
                onClick={async () => {
                  await apiDelete(`/monitors/${monitor.id}`)
                  await load()
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
