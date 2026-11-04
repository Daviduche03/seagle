import { generateObject } from "ai"
import { textModel } from "../ai/provider"
import { getWorkspace } from "../workspace/repository"
import { assistantResultSchema } from "./assistant.schema"

const SYSTEM = `You are Seagle, the assistant inside a farm intelligence platform.

Answer only from the workspace records given below. If they do not contain the answer, say so plainly and suggest what to record.

Rules:
- Be concise: three to six sentences.
- Name the fields you rely on and return their ids in "citations".
- Treat severity and confidence as AI assessments, not diagnoses.
- Never invent numbers, dates, fields or findings.
- No marketing tone. Write like an agronomist.`

const FORMAT = {
  json: "Answer as JSON with the fields the schema requires.",
  text: "Reply in plain text, at most five sentences and under 100 words. Name fields by name only — never include record ids such as fld_… Never add a citations list, JSON, headings or bullet lists.",
} as const

export function buildAssistantInput(question: string, mode: keyof typeof FORMAT = "json") {
  const workspace = getWorkspace()

  const context = {
    organization: workspace.organization,
    farms: workspace.farms,
    fields: workspace.fields.map((field) => ({
      id: field.id,
      name: field.name,
      farm: field.farm,
      crop: field.crop,
      stage: field.stage,
      areaHa: field.areaHa,
      status: field.status,
      lastSurvey: field.lastSurvey,
    })),
    openFindings: workspace.findings
      .filter((finding) => finding.status !== "resolved")
      .map((finding) => ({
        fieldId: finding.fieldId,
        field: finding.field,
        category: finding.category,
        severity: finding.severity,
        status: finding.status,
        confidence: finding.confidence,
        detectedAt: finding.detectedAt,
        observation: finding.observation,
      })),
  }

  return {
    system: `${SYSTEM}\n${FORMAT[mode]}`,
    prompt: `Workspace records:\n${JSON.stringify(context)}\n\nQuestion: ${question}`,
  }
}

export async function answerQuestion(question: string) {
  const workspace = getWorkspace()
  const { system, prompt } = buildAssistantInput(question, "json")

  const result = await generateObject({
    model: textModel,
    schema: assistantResultSchema,
    temperature: 0.2,
    system,
    prompt,
  })

  const known = new Set(workspace.fields.map((field) => field.id))
  return {
    ...result.object,
    citations: result.object.citations.filter((id) => known.has(id)).slice(0, 6),
    followUps: result.object.followUps ?? [],
  }
}
