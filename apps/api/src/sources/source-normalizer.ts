import { createHash } from "node:crypto"
import type { CollectedCandidate } from "@hots-monitor/shared"

const TRACKING_PARAM_PREFIXES = ["utm_"]
const TRACKING_PARAMS = new Set(["ref", "fbclid", "gclid", "mc_cid", "mc_eid"])

export function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl)

  for (const key of Array.from(url.searchParams.keys())) {
    const isTrackingPrefix = TRACKING_PARAM_PREFIXES.some((prefix) => key.startsWith(prefix))
    if (isTrackingPrefix || TRACKING_PARAMS.has(key)) {
      url.searchParams.delete(key)
    }
  }

  url.hash = ""
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "")
  }

  return url.toString()
}

export function candidateHash(title: string, url: string): string {
  const normalizedTitle = title.trim().toLowerCase().replace(/\s+/g, " ")
  const normalizedUrl = normalizeUrl(url)
  return createHash("sha256").update(`${normalizedTitle}|${normalizedUrl}`).digest("hex")
}

export function dedupeCandidates(items: CollectedCandidate[]): CollectedCandidate[] {
  const seen = new Set<string>()
  const deduped: CollectedCandidate[] = []

  for (const item of items) {
    const key = candidateHash(item.title, item.url)
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push({
      ...item,
      url: normalizeUrl(item.url)
    })
  }

  return deduped
}
