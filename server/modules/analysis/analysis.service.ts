import { generateText } from "ai"
import { visionModel } from "../ai/provider"
import { getFieldContext } from "../workspace/repository"
import { ApiError } from "../../http/errors"
import type { AnalysisRequest } from "./analysis.schema"
import { ANALYSIS_SYSTEM, buildAnalysisPrompt } from "./analysis.prompt"
import { segmentFrame } from "../segmentation/segmentation.service"

export interface NormalizedObservation {
  category: string
  severity: "low" | "medium" | "high" | "critical"
  confidence: number
  observation: string
  interpretation: string
  recommendation: string
  areaShare: number
}

const SEVERITIES = new Set(["low", "medium", "high", "critical"])

/**
 * The model is reliable at the agronomy and unreliable at strict JSON shapes:
 * sometimes one object, sometimes an array, sometimes prose numbers. We ask for
 * JSON, parse defensively, and normalise here instead of failing the request.
 */
export async function analyseFrame(input: AnalysisRequest) {
  const context = getFieldContext(input.fieldId)
  if (!context) throw new ApiError(404, "field_not_found", "Unknown field")

  const [vegetation, leaf, soil] = await Promise.allSettled([
    segmentFrame(input.image, "vegetation"),
    segmentFrame(input.image, "leaf"),
    segmentFrame(input.image, "bare soil"),
  ])

  const segments = [vegetation, leaf, soil]
    .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof segmentFrame>>> => result.status === "fulfilled")
    .map((result) => result.value)

  const result = await generateText({
    model: visionModel,
    temperature: 0.2,
    maxOutputTokens: 3000,
    system: ANALYSIS_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildAnalysisPrompt(input, { ...context.field, findings: context.findings }, segments),
          },
          { type: "image", image: input.image },
        ],
      },
    ],
  })

  const parsed = parseJson(result.text)

  return {
    ...normalize(parsed),
    segmentation: segments.map((segment) => ({
      prompt: segment.prompt,
      count: segment.count,
      coverage: segment.coverage,
    })),
    field: context.field,
    model: "sam-3.1 + muse-spark-1.3",
  }
}

function parseJson(text: string): Record<string, unknown> {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) {
    throw new ApiError(502, "analysis_unparseable", `The model did not return JSON: ${text.slice(0, 240)}`)
  }
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    throw new ApiError(502, "analysis_unparseable", "The model returned invalid JSON")
  }
}

function normalize(raw: Record<string, unknown>) {
  const limitations = toStringArray(raw.limitations)
  const array = Array.isArray(raw.observations) ? (raw.observations as Record<string, unknown>[]) : []
  const candidates = array.length ? array : raw.category || raw.observation ? [raw] : []

  const observations: NormalizedObservation[] = candidates
    .map((item) => ({
      category: String(item.category ?? item.label ?? "Observation"),
      severity: (SEVERITIES.has(String(item.severity)) ? String(item.severity) : "medium") as NormalizedObservation["severity"],
      confidence: parseConfidence(item.confidence),
      observation: String(item.observation ?? ""),
      interpretation: String(item.interpretation ?? ""),
      recommendation: String(item.recommendation ?? ""),
      areaShare: parsePercent(item.areaShare),
    }))
    .filter((observation) => observation.observation.length > 0)

  return {
    usable: raw.usable === undefined ? observations.length > 0 : Boolean(raw.usable),
    summary: String(raw.summary ?? limitations[0] ?? ""),
    limitations,
    observations,
  }
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === "string" && value.trim()) return [value]
  return []
}

function parseConfidence(value: unknown): number {
  const number = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""))
  if (!Number.isFinite(number)) return 0.6
  const normalized = number > 1 ? number / 100 : number
  return Math.max(0, Math.min(1, Math.round(normalized * 100) / 100))
}

function parsePercent(value: unknown): number {
  if (typeof value === "number") return Math.max(0, Math.min(100, value))
  const match = String(value ?? "").match(/\d+(?:\.\d+)?/)
  return match ? Math.min(100, Number(match[0])) : 0
}
