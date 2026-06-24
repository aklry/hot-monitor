import { FormEvent, useEffect, useState } from "react"
import { apiGet, apiPatch, apiPost } from "../../api/client"
import { requestBrowserNotificationPermission } from "../../utils/browser-notifications"
import "./SettingsPage.css"

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")

  useEffect(() => {
    apiGet<Record<string, string>>("/settings").then(setSettings)
  }, [])

  function update(key: string, value: string) {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    await apiPatch("/settings", settings)
    setMessage("Settings saved")
  }

  return (
    <form className="settings-page settings-grid" onSubmit={save}>
      <Field label="DeepSeek API Key" value={settings.DEEPSEEK_API_KEY ?? ""} onChange={(v) => update("DEEPSEEK_API_KEY", v)} />
      <Field label="DeepSeek Model" value={settings.DEEPSEEK_MODEL ?? "deepseek-v4-flash"} onChange={(v) => update("DEEPSEEK_MODEL", v)} />
      <Field label="SMTP Host" value={settings.SMTP_HOST ?? ""} onChange={(v) => update("SMTP_HOST", v)} />
      <Field label="SMTP Port" value={settings.SMTP_PORT ?? "587"} onChange={(v) => update("SMTP_PORT", v)} />
      <Field label="SMTP User" value={settings.SMTP_USER ?? ""} onChange={(v) => update("SMTP_USER", v)} />
      <Field label="SMTP Password" value={settings.SMTP_PASS ?? ""} onChange={(v) => update("SMTP_PASS", v)} />
      <Field label="SMTP From" value={settings.SMTP_FROM ?? ""} onChange={(v) => update("SMTP_FROM", v)} />
      <Field label="SMTP To" value={settings.SMTP_TO ?? ""} onChange={(v) => update("SMTP_TO", v)} />
      <Field label="Trend Scope" value={settings.TRENDS_DEFAULT_SCOPE ?? "ai programming"} onChange={(v) => update("TRENDS_DEFAULT_SCOPE", v)} />
      <Field label="Trend Interval" value={settings.TRENDS_INTERVAL_MINUTES ?? "60"} onChange={(v) => update("TRENDS_INTERVAL_MINUTES", v)} />
      <div className="settings-actions">
        <button className="primary">Save settings</button>
        <button type="button" onClick={async () => setMessage(JSON.stringify(await apiPost("/settings/test-ai")))}>
          Test AI
        </button>
        <button type="button" onClick={async () => setMessage(JSON.stringify(await apiPost("/settings/test-email")))}>
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
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}
