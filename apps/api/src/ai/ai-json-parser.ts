import type { ZodSchema } from "zod"

export function parseAiJson<T>(raw: string, schema: ZodSchema<T>): T {
  const trimmed = raw.trim()
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(withoutFence)
  } catch (error) {
    throw new Error(`AI response was not valid JSON: ${(error as Error).message}`)
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`AI response did not match schema: ${result.error.message}`)
  }

  return result.data
}
