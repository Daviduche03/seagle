import { readFileSync } from "node:fs"
import { resolve } from "node:path"

export interface WorkspaceSnapshot {
  organization: string
  farms: { id: string; name: string; region: string; areaHa: number }[]
  fields: {
    id: string
    name: string
    farmId: string
    farm: string
    crop: string | null
    stage: string | null
    areaHa: number
    status: string
    lastSurvey: string | null
  }[]
  findings: {
    id: string
    fieldId: string
    field: string
    category: string
    severity: string
    status: string
    confidence: number
    detectedAt: string
    observation: string
  }[]
}

interface Seed {
  organization: { name: string }
  farms: { id: string; name: string; region: string; totalAreaHa: number }[]
  fields: {
    id: string
    name: string
    farmId: string
    areaHa: number
    status: string
    cropCycleId: string | null
  }[]
  cropCycles: { id: string; fieldId: string; crop: string; growthStage: string }[]
  surveys: { fieldId: string; capturedAt: string; status: string }[]
  observations: {
    id: string
    fieldId: string
    category: string
    severity: string
    status: string
    confidence: number
    detectedAt: string
    observation: string
  }[]
}

let cache: WorkspaceSnapshot | null = null

/** Read the same demo dataset the frontend renders, once per process. */
export function getWorkspace(): WorkspaceSnapshot {
  if (cache) return cache

  const seedPath = resolve(process.cwd(), "src/data/seed.json")
  const seed = JSON.parse(readFileSync(seedPath, "utf8")) as Seed

  const farmById = new Map(seed.farms.map((farm) => [farm.id, farm]))
  const cycleByField = new Map(seed.cropCycles.map((cycle) => [cycle.fieldId, cycle]))
  const lastSurvey = new Map<string, string>()

  for (const survey of seed.surveys) {
    if (survey.status !== "completed") continue
    const current = lastSurvey.get(survey.fieldId)
    if (!current || new Date(survey.capturedAt) > new Date(current)) {
      lastSurvey.set(survey.fieldId, survey.capturedAt)
    }
  }

  cache = {
    organization: seed.organization.name,
    farms: seed.farms.map((farm) => ({
      id: farm.id,
      name: farm.name,
      region: farm.region,
      areaHa: farm.totalAreaHa,
    })),
    fields: seed.fields.map((field) => {
      const farm = farmById.get(field.farmId)
      const cycle = cycleByField.get(field.id)
      return {
        id: field.id,
        name: field.name,
        farmId: field.farmId,
        farm: farm?.name ?? "Unknown farm",
        crop: cycle?.crop ?? null,
        stage: cycle?.growthStage ?? null,
        areaHa: field.areaHa,
        status: field.status,
        lastSurvey: lastSurvey.get(field.id) ?? null,
      }
    }),
    findings: seed.observations.map((obs) => ({
      id: obs.id,
      fieldId: obs.fieldId,
      field: seed.fields.find((field) => field.id === obs.fieldId)?.name ?? "Unknown field",
      category: obs.category,
      severity: obs.severity,
      status: obs.status,
      confidence: obs.confidence,
      detectedAt: obs.detectedAt,
      observation: obs.observation,
    })),
  }

  return cache
}

export function getFieldContext(fieldId: string) {
  const workspace = getWorkspace()
  const field = workspace.fields.find((item) => item.id === fieldId)
  if (!field) return null
  return {
    field,
    findings: workspace.findings
      .filter((finding) => finding.fieldId === fieldId)
      .slice(0, 8),
  }
}
