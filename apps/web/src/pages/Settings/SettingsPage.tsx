import { type FormEvent, useEffect, useState } from "react"
import { Activity, Gauge, Radar, Save, Zap } from "lucide-react"
import { apiGet, apiPatch } from "$/api/client"
import { requestBrowserNotificationPermission } from "$/utils/browser-notifications"
import "./SettingsPage.css"

interface DailyUsage {
  totalTokens: number
  promptTokens: number
  completionTokens: number
  requestCount: number
}

interface SettingsResponse {
  [key: string]: string | DailyUsage | number | undefined
  _dailyUsage?: DailyUsage
  _dailyBudget?: number
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null)
  const [dailyBudget, setDailyBudget] = useState<number>(0)
  const [message, setMessage] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void apiGet<SettingsResponse>("/settings")
      .then((data) => {
        const { _dailyUsage, _dailyBudget, ...rest } = data
        const stringSettings: Record<string, string> = {}
        for (const [k, v] of Object.entries(rest)) {
          if (typeof v === "string") stringSettings[k] = v
        }
        setSettings(stringSettings)
        if (_dailyUsage) setDailyUsage(_dailyUsage as DailyUsage)
        if (_dailyBudget) setDailyBudget(_dailyBudget as number)
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : "Failed to load settings")
      })
  }, [])

  function update(key: string, value: string) {
    setSettings((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    await apiPatch("/settings", settings)
    setSaved(true)
    setMessage("Settings saved")
    setTimeout(() => setMessage(""), 3000)
  }

  const budgetValue = settings.AI_DAILY_TOKEN_BUDGET ?? ""
  const usagePercent =
    dailyBudget > 0 && dailyUsage ? Math.min(100, (dailyUsage.totalTokens / dailyBudget) * 100) : 0

  return (
    <form className="settings-page" onSubmit={save}>
      <div className="settings-sections">
        <section className="panel settings-card">
          <div className="settings-card-header">
            <Radar size={18} />
            <div>
              <h2>Trend Discovery</h2>
              <p className="muted">Configure how trends are scanned and analyzed</p>
            </div>
          </div>
          <div className="settings-fields">
            <label className="field">
              Default Scope
              <input
                value={settings.TRENDS_DEFAULT_SCOPE ?? "ai programming"}
                onChange={(event) => update("TRENDS_DEFAULT_SCOPE", event.target.value)}
                placeholder="e.g. ai programming"
              />
            </label>
            <label className="field">
              Scan Interval (minutes)
              <input
                type="number"
                min={1}
                value={settings.TRENDS_INTERVAL_MINUTES ?? "60"}
                onChange={(event) => update("TRENDS_INTERVAL_MINUTES", event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="panel settings-card">
          <div className="settings-card-header">
            <Gauge size={18} />
            <div>
              <h2>AI Cost Control</h2>
              <p className="muted">Monitor and limit daily token consumption</p>
            </div>
          </div>
          <div className="settings-fields">
            <label className="field">
              Daily Token Budget
              <input
                value={budgetValue}
                onChange={(event) => update("AI_DAILY_TOKEN_BUDGET", event.target.value)}
                placeholder="0 = unlimited"
              />
            </label>
          </div>
          {dailyUsage && (
            <div className="usage-card">
              <div className="usage-header">
                <div className="usage-label">
                  <Activity size={14} />
                  <span>Today's Usage</span>
                </div>
                <span className="usage-total">{dailyUsage.totalTokens.toLocaleString()} tokens</span>
              </div>
              {dailyBudget > 0 && (
                <div className="usage-bar-track">
                  <div
                    className="usage-bar-fill"
                    style={{ width: `${usagePercent}%` }}
                    data-warning={usagePercent > 80}
                  />
                </div>
              )}
              <div className="usage-stats">
                <div className="usage-stat">
                  <span className="usage-stat-value">{dailyUsage.requestCount}</span>
                  <span className="usage-stat-label">requests</span>
                </div>
                <div className="usage-stat">
                  <span className="usage-stat-value">{dailyUsage.promptTokens.toLocaleString()}</span>
                  <span className="usage-stat-label">prompt</span>
                </div>
                <div className="usage-stat">
                  <span className="usage-stat-value">{dailyUsage.completionTokens.toLocaleString()}</span>
                  <span className="usage-stat-label">completion</span>
                </div>
                {dailyBudget > 0 && (
                  <div className="usage-stat">
                    <span className="usage-stat-value">{Math.round(usagePercent)}%</span>
                    <span className="usage-stat-label">of budget</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="panel settings-card">
          <div className="settings-card-header">
            <Zap size={18} />
            <div>
              <h2>Notifications</h2>
              <p className="muted">Browser push notification permissions</p>
            </div>
          </div>
          <div className="settings-actions">
            <button type="button" className="secondary-action" onClick={requestBrowserNotificationPermission}>
              Enable Browser Notifications
            </button>
          </div>
        </section>
      </div>

      <div className="settings-footer">
        <button className="primary settings-save" type="submit" data-saved={saved}>
          <Save size={16} />
          {saved ? "Saved" : "Save Settings"}
        </button>
      </div>

      {message && <div className="notice settings-notice">{message}</div>}
    </form>
  )
}
