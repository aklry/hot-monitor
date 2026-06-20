const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000"

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  return readResponse<T>(response)
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  return readResponse<T>(response)
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  return readResponse<T>(response)
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { method: "DELETE" })
  return readResponse<T>(response)
}

export function notificationStream() {
  if (typeof EventSource === "undefined") {
    return null
  }

  return new EventSource(`${API_BASE}/notifications/stream`)
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(readErrorMessage(text) || `HTTP ${response.status}`)
  }
  return (await response.json()) as T
}

function readErrorMessage(text: string): string {
  if (!text) {
    return ""
  }

  try {
    const parsed = JSON.parse(text) as { message?: unknown; error?: unknown }
    if (typeof parsed.message === "string") {
      return parsed.message
    }
    if (Array.isArray(parsed.message)) {
      return parsed.message.join("; ")
    }
    if (typeof parsed.error === "string") {
      return parsed.error
    }
  } catch {
    return text
  }

  return text
}