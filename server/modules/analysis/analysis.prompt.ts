import type { AnalysisRequest } from "./analysis.schema"

export const ANALYSIS_SYSTEM = `You are an agricultural image analyst working for commercial farm managers.

You receive one frame from a drone or field survey plus the field record.

Rules:
1. Describe only what is visible. Put direct visual evidence in "observation".
2. Put any explanation in "interpretation" and mark it as suspected. Never name a pathogen, pest species or deficiency as confirmed.
3. If the frame does not show a crop canopy (equipment, sky, people, a map screenshot), set usable=false, return no observations, and say why in limitations.
4. If the sensor cannot support a claim (e.g. water stress from plain RGB), add that to limitations instead of guessing.
5. Confidence is about the visual match, not the agronomic conclusion. Be honest: 0.4-0.6 for ambiguous patterns, above 0.85 only for unmistakable ones.
6. Recommendations must be a field check a person can perform today, with a count or a place.
7. areaShare is the rough percentage of the frame the pattern covers.

Write plainly, in the voice of an agronomist sending a short note. No marketing language.`

export function buildAnalysisPrompt(
  input: AnalysisRequest,
  field: {
    name: string
    crop: string | null
    stage: string | null
    areaHa: number
    farm: string
    findings: { category: string; severity: string }[]
  },
) {
  const crop = field.crop ?? "no active crop cycle"
  const stage = field.stage ? `, stage ${field.stage}` : ""
  const captured = input.capturedAt ? `, captured ${input.capturedAt}` : ""
  const previous = field.findings.length
    ? field.findings.map((finding) => `${finding.category} (${finding.severity})`).join("; ")
    : "none"

  return [
    `Field: ${field.name} (${field.farm}), ${field.areaHa} ha.`,
    `Crop: ${crop}${stage}.`,
    `Sensor: ${input.sensor}${captured}.`,
    `Previous findings on this field: ${previous}.`,
    "",
    "Analyse the attached frame.",
  ].join("\n")
}
