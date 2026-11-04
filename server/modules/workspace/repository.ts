import { db } from "../../db/client"
import type { Seed } from "../../../src/data/types"

/** The API's only data access point. Everything else asks it questions. */

let seedCache: Seed | null = null

const parse = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback
  try {
    return JSON.parse(String(value)) as T
  } catch {
    return fallback
  }
}

const camel = (row: Record<string, unknown>) => {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    out[key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())] = value
  }
  return out
}

const rows = (table: string) => (db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[]).map(camel)

export function getSeed(): Seed {
  if (seedCache) return seedCache

  const organization = rows("organizations")[0] as unknown as Seed["organization"]
  const team = rows("team_members").map((row) => ({ ...row, farms: parse(row.farms, []) })) as unknown as Seed["team"]
  const farms = rows("farms").map((row) => ({
    ...row,
    centroid: parse(row.centroid, [0, 0]),
    boundary: parse(row.boundary, []),
  })) as unknown as Seed["farms"]
  const fields = rows("fields").map((row) => ({
    ...row,
    boundary: parse(row.boundary, []),
    centroid: parse(row.centroid, [0, 0]),
  })) as unknown as Seed["fields"]
  const cropCycles = rows("crop_cycles") as unknown as Seed["cropCycles"]
  const surveys = rows("surveys").map((row) => ({
    ...row,
    hasGeo: Boolean(row.hasGeo),
    assets: parse(row.assets, []),
  })) as unknown as Seed["surveys"]
  const observations = rows("observations").map((row) => ({
    ...row,
    zone: row.zone ? parse(row.zone, null) : null,
  })) as unknown as Seed["observations"]
  const actions = rows("actions") as unknown as Seed["actions"]
  const reports = rows("reports").map((row) => ({ ...row, reviewed: Boolean(row.reviewed) })) as unknown as Seed["reports"]
  const events = rows("events") as unknown as Seed["events"]
  const assets = surveys.flatMap((survey) => survey.assets)

  seedCache = {
    generatedAt: new Date().toISOString(),
    organization,
    team,
    farms,
    fields,
    cropCycles,
    surveys,
    assets,
    observations,
    actions,
    reports,
    events,
  } as Seed

  return seedCache
}

export function invalidateWorkspace() {
  seedCache = null
}

// ---------------------------------------------------------------------------
// Derived views used by the assistant and the image analysis
// ---------------------------------------------------------------------------

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

export function getWorkspace(): WorkspaceSnapshot {
  const seed = getSeed()
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

  return {
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
}

export function getFieldContext(fieldId: string) {
  const workspace = getWorkspace()
  const field = workspace.fields.find((item) => item.id === fieldId)
  if (!field) return null
  return {
    field,
    findings: workspace.findings.filter((finding) => finding.fieldId === fieldId).slice(0, 8),
  }
}
