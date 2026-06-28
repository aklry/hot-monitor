import { type FormEvent, useEffect, useState } from "react"
import { apiGet, apiPatch, apiPost } from "$/api/client"
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
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    await apiPatch("/settings", settings)
    setMessage("Settings saved")
  }

  const budgetValue = settings.AI_DAILY_TOKEN_BUDGET ?? ""
  const usagePercent =
    dailyBudget > 0 && dailyUsage ? Math.min(100, (dailyUsage.totalTokens / dailyBudget) * 100) : 0

  return (
    <form className="settings-page settings-grid" onSubmit={save}>
      <Field
        label="DeepSeek API Key"
        value={settings.DEEPSEEK_API_KEY ?? ""}
        onChange={(v) => update("DEEPSEEK_API_KEY", v)}
      />
      <Field
        label="DeepSeek Model"
        value={settings.DEEPSEEK_MODEL ?? "deepseek-v4-flash"}
        onChange={(v) => update("DEEPSEEK_MODEL", v)}
      />
      <Field
        label="SMTP Host"
        value={settings.SMTP_HOST ?? ""}
        onChange={(v) => update("SMTP_HOST", v)}
      />
      <Field
        label="SMTP Port"
        value={settings.SMTP_PORT ?? "587"}
        onChange={(v) => update("SMTP_PORT", v)}
      />
      <Field
        label="SMTP User"
        value={settings.SMTP_USER ?? ""}
        onChange={(v) => update("SMTP_USER", v)}
      />
      <Field
        label="SMTP Password"
        value={settings.SMTP_PASS ?? ""}
        onChange={(v) => update("SMTP_PASS", v)}
      />
      <Field
        label="SMTP From"
        value={settings.SMTP_FROM ?? ""}
        onChange={(v) => update("SMTP_FROM", v)}
      />
      <Field
        label="SMTP To"
        value={settings.SMTP_TO ?? ""}
        onChange={(v) => update("SMTP_TO", v)}
      />
      <Field
        label="Trend Scope"
        value={settings.TRENDS_DEFAULT_SCOPE ?? "ai programming"}
        onChange={(v) => update("TRENDS_DEFAULT_SCOPE", v)}
      />
      <Field
        label="Trend Interval"
        value={settings.TRENDS_INTERVAL_MINUTES ?? "60"}
        onChange={(v) => update("TRENDS_INTERVAL_MINUTES", v)}
      />

      <fieldset className="settings-section">
        <legend>AI Cost Control</legend>
        <Field
          label="Daily Token Budget"
          value={budgetValue}
          onChange={(v) => update("AI_DAILY_TOKEN_BUDGET", v)}
          placeholder="0 = unlimited"
        />
        {dailyUsage && (
          <div className="token-usage">
            <div className="usage-header">
              <span>Today's Usage</span>
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
            <div className="usage-detail">
              <span>{dailyUsage.requestCount} requests</span>
              <span>
                {dailyUsage.promptTokens.toLocaleString()} prompt +{" "}
                {dailyUsage.completionTokens.toLocaleString()} completion
              </span>
            </div>
          </div>
        )}
      </fieldset>

      <div className="settings-actions">
        <button className="primary">Save settings</button>
        <button
          type="button"
          onClick={async () => setMessage(JSON.stringify(await apiPost("/settings/test-ai")))}
        >
          Test AI
        </button>
        <button
          type="button"
          onClick={async () => setMessage(JSON.stringify(await apiPost("/settings/test-email")))}
        >
          Test Email
        </button>
        <button type="button" onClick={requestBrowserNotificationPermission}>
          Browser Permission
        </button>
      </div>
      {message && <div className="notice">{message}</div>}
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="field">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}
