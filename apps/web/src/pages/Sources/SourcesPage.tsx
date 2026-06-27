import { type FormEvent, useEffect, useState } from "react"
import { apiDelete, apiGet, apiPatch, apiPost } from "$/api/client"
import type { SourceRecord } from "$/types"
import "./SourcesPage.css"

export function SourcesPage() {
  const [sources, setSources] = useState<SourceRecord[]>([])
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [message, setMessage] = useState("")
  const [pendingDelete, setPendingDelete] = useState<SourceRecord | null>(null)

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

  async function confirmDelete() {
    if (!pendingDelete) return
    const source = pendingDelete
    setPendingDelete(null)

    try {
      await apiDelete(`/sources/${source.id}`)
      setMessage(`${source.name} deleted`)
      await load()
    } catch (error) {
      setMessage(`${source.name}: ${(error as Error).message}`)
    }
  }

  return (
    <section className="sources-page">
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
                  try {
                    const result = await apiPost<{ count: number }>(`/sources/${source.id}/test`, {
                      query: "ai"
                    })
                    setMessage(`${source.name}: ${result.count} sample items`)
                  } catch (error) {
                    setMessage(`${source.name}: ${(error as Error).message}`)
                  }
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
              <button className="danger" onClick={() => setPendingDelete(source)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {pendingDelete && (
        <div className="modal-overlay" onClick={() => setPendingDelete(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete source</h3>
            <p>
              Are you sure you want to delete <strong>{pendingDelete.name}</strong>?
              This also removes all collected items from it.
            </p>
            <div className="modal-actions">
              <button onClick={() => setPendingDelete(null)}>Cancel</button>
              <button className="danger" onClick={() => void confirmDelete()}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
