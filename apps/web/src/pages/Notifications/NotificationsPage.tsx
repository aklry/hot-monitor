import { useEffect, useState } from "react"
import { apiGet, apiPatch, apiPost } from "$/api/client"
import type { NotificationRecord } from "$/types"
import "./NotificationsPage.css"

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationRecord[]>([])
  const load = () => apiGet<NotificationRecord[]>("/notifications").then(setItems)

  useEffect(() => {
    void load()
  }, [])

  return (
    <section className="notifications-page">
      <div className="list-panel">
        {items.map((item) => (
          <article key={item.id} className="record-row">
            <div>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
              {item.relatedItem && (
                <a
                  className="article-link"
                  href={item.relatedItem.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.relatedItem.title}
                </a>
              )}
              {item.relatedItem?.summary && (
                <p className="article-summary">{item.relatedItem.summary}</p>
              )}
              <small>
                {item.channel} / {item.status}
                {item.error ? ` / ${item.error}` : ""}
              </small>
            </div>
            <div className="row-actions">
              <button
                onClick={async () => {
                  await apiPatch(`/notifications/${item.id}/read`)
                  await load()
                }}
              >
                Read
              </button>
              {item.channel === "email" && (
                <button
                  onClick={async () => {
                    await apiPost(`/notifications/${item.id}/retry`)
                    await load()
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
