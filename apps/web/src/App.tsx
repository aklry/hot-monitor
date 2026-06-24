import { useEffect, useState } from "react"
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router"
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
import { DashboardPage } from "./pages/Dashboard/DashboardPage"
import { MonitorsPage } from "./pages/Monitors/MonitorsPage"
import { NotificationsPage } from "./pages/Notifications/NotificationsPage"
import { SettingsPage } from "./pages/Settings/SettingsPage"
import { SourcesPage } from "./pages/Sources/SourcesPage"
import { TrendsPage } from "./pages/Trends/TrendsPage"
import { TrendDetailPage } from "./pages/TrendDetail/TrendDetailPage"
import { requestBrowserNotificationPermission } from "./utils/browser-notifications"

type Page = "dashboard" | "monitors" | "trends" | "sources" | "notifications" | "settings"

const navItems: Array<{ page: Page; path: string; label: string; icon: typeof Gauge }> = [
  { page: "dashboard", path: "/", label: "Signal", icon: Gauge },
  { page: "monitors", path: "/monitors", label: "Monitors", icon: Search },
  { page: "trends", path: "/trends", label: "Radar", icon: Radar },
  { page: "sources", path: "/sources", label: "Sources", icon: Database },
  { page: "notifications", path: "/notifications", label: "Alerts", icon: Bell },
  { page: "settings", path: "/settings", label: "Settings", icon: Settings }
]

export function App() {
  const [signalCount, setSignalCount] = useState(0)
  const location = useLocation()

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

  const currentTitle = location.pathname.startsWith("/trends/")
    ? "Radar"
    : (navItems.find((item) => item.path === location.pathname)?.label ?? "Signal")

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
              <NavLink
                key={item.page}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) => (isActive ? "nav-button active" : "nav-button")}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
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

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/monitors" element={<MonitorsPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/trends/:id" element={<TrendDetailPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
