import { FormEvent, useEffect, useState } from "react"
import { apiGet, apiPatch, apiPost } from "../api/client"
import type { SourceRecord } from "../types"

export function SourcesPage() {
  const [sources, setSources] = useState<SourceRecord[]>([])
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [message, setMessage] = useState("")

  const load = () => apiGet<SourceRecord[]>("/sources").then(setSources)

  useEffect(() => {
    void load()
  }, [])

  async function add(event: FormEvent) {
    event.preventDefault()
    await apiPost("/sources/rss", { name, url, weight: 50 })
    setName("")
    setUrl("")
    await load()
  }

  return (
    <section className="stack">
      <form className="panel form-grid" onSubmit={add}>
        <label>
          RSS name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          RSS URL
          <input value={url} onChange={(event) => setUrl(event.target.value)} required />
        </label>
        <button className="primary">Add RSS</button>
      </form>
      {message && <div className="notice">{message}</div>}
      <div className="list-panel">
        {sources.map((source) => (
          <article key={source.id} className="record-row">
            <div>
              <strong>{source.name}</strong>
              <p>{source.url ?? source.type}</p>
              <small>weight {source.weight}</small>
            </div>
            <div className="row-actions">
              <button
                onClick={async () => {
                  const result = await apiPost<{ count: number }>(`/sources/${source.id}/test`, {
                    query: "ai"
                  })
                  setMessage(`${source.name}: ${result.count} sample items`)
                }}
              >
                Test
              </button>
              <button
                onClick={async () => {
                  await apiPatch(`/sources/${source.id}`, { enabled: !source.enabled })
                  await load()
                }}
              >
                {source.enabled ? "Disable" : "Enable"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
