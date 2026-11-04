import { generateObject } from "ai"
import { textModel } from "../ai/provider"
import { getFieldContext } from "../workspace/repository"
import { ApiError } from "../../http/errors"
import { reportResultSchema } from "./reports.schema"

const SYSTEM = `You write field inspection reports for a commercial farm.

Structure the report in two to five sections. State what was inspected, what was observed, and what should happen next.

Rules:
- Separate observed evidence from interpretation. Mark interpretation as suspected.
- Quote dates, areas and confidence values from the record; never invent them.
- Close with verification steps and any data limitations.
- Plain professional prose, no marketing language, no emoji.`

export async function draftFieldReport(fieldId: string) {
  const context = getFieldContext(fieldId)
  if (!context) throw new ApiError(404, "field_not_found", "Unknown field")

  const result = await generateObject({
    model: textModel,
    schema: reportResultSchema,
    temperature: 0.3,
    system: SYSTEM,
    prompt: `Field record:\n${JSON.stringify(context)}\n\nDraft the inspection report.`,
  })

  return { ...result.object, field: context.field }
}
