import { useEffect, useMemo, useState } from "react"
import {
  Bell,
  Database,
  Gauge,
  Radio,
  Radar,
  Search,
  Settings,
  Zap
} from "lucide-react"
import { notificationStream } from "./api/client"
import type { NotificationRecord } from "./types"
import { DashboardPage } from "./pages/DashboardPage"
import { MonitorsPage } from "./pages/MonitorsPage"
import { NotificationsPage } from "./pages/NotificationsPage"
import { SettingsPage } from "./pages/SettingsPage"
import { SourcesPage } from "./pages/SourcesPage"
import { TrendsPage } from "./pages/TrendsPage"
import { requestBrowserNotificationPermission } from "./utils/browser-notifications"

type Page = "dashboard" | "monitors" | "trends" | "sources" | "notifications" | "settings"

const navItems: Array<{ page: Page; label: string; icon: typeof Gauge }> = [
  { page: "dashboard", label: "Signal", icon: Gauge },
  { page: "monitors", label: "Monitors", icon: Search },
  { page: "trends", label: "Radar", icon: Radar },
  { page: "sources", label: "Sources", icon: Database },
  { page: "notifications", label: "Alerts", icon: Bell },
  { page: "settings", label: "Settings", icon: Settings }
]

export function App() {
  const [page, setPage] = useState<Page>("dashboard")
  const [signalCount, setSignalCount] = useState(0)

  useEffect(() => {
    const stream = notificationStream()
    if (!stream) {
      return
    }

    stream.onmessage = (event) => {
      const payload = JSON.parse(event.data) as NotificationRecord
      setSignalCount((count) => count + 1)
      if (
        payload.channel === "browser" &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        const item = payload.relatedItem
        const notification = new Notification(item?.title ?? payload.title, {
          body: formatNotificationBody(payload)
        })

        notification.onclick = () => {
          if (item?.url) {
            window.open(item.url, "_blank", "noopener,noreferrer")
          }
        }
      }
    }
    return () => stream.close()
  }, [])

  const currentTitle = useMemo(
    () => navItems.find((item) => item.page === page)?.label ?? "Signal",
    [page]
  )

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand-mark">
          <Radio size={21} />
          <span>Hots Monitor</span>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.page}
                className={page === item.page ? "nav-button active" : "nav-button"}
                onClick={() => setPage(item.page)}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="top-bar">
          <div>
            <p className="eyebrow">multi-source intelligence console</p>
            <h1>{currentTitle}</h1>
          </div>
          <button
            className="icon-action"
            onClick={requestBrowserNotificationPermission}
            title="Enable browser notifications"
          >
            <Zap size={18} />
            <span>{signalCount}</span>
          </button>
        </header>

        {page === "dashboard" && <DashboardPage />}
        {page === "monitors" && <MonitorsPage />}
        {page === "trends" && <TrendsPage />}
        {page === "sources" && <SourcesPage />}
        {page === "notifications" && <NotificationsPage />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
  )
}

function formatNotificationBody(notification: NotificationRecord) {
  const item = notification.relatedItem
  const text = item?.summary || item?.content || notification.message
  return truncateNotificationText(text)
}

function truncateNotificationText(text: string, maxLength = 240) {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength - 1)}...`
}
