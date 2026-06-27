import { z } from "zod"
import { parseAiJson } from "./ai-json-parser"

const TestSchema = z.object({ ok: z.boolean() })

describe("parseAiJson", () => {
  it("parses plain json", () => {
    expect(parseAiJson('{"ok":true}', TestSchema)).toEqual({ ok: true })
  })

  it("parses fenced json", () => {
    expect(parseAiJson('```json\n{"ok":true}\n```', TestSchema)).toEqual({ ok: true })
  })

  it("throws a clear error for invalid json", () => {
    expect(() => parseAiJson("not json", TestSchema)).toThrow("AI response was not valid JSON")
  })

  it("throws a clear error for schema mismatches", () => {
    expect(() => parseAiJson('{"ok":"yes"}', TestSchema)).toThrow(
      "AI response did not match schema"
    )
  })
})
