import fixture from "./seed.json"
import type {
  Farm,
  Field,
  CropCycle,
  Observation,
  Seed,
  Survey,
  TeamMember,
} from "./types"

/**
 * The workspace is loaded from the API (SQLite behind it) once at boot.
 * The bundled fixture is the offline fallback, so the demo still opens if the
 * API is down — it is the same shape, just stale.
 */
let state = fixture as unknown as Seed

export let seed: Seed = state
export let organization = state.organization
export let farms = state.farms
export let fields = state.fields
export let team = state.team
export let surveys = state.surveys
export let observations = state.observations
export let actions = state.actions
export let reports = state.reports
export let events = state.events

let fieldById = new Map<string, Field>()
let farmById = new Map<string, Farm>()
let memberById = new Map<string, TeamMember>()
let surveyById = new Map<string, Survey>()
let observationById = new Map<string, Observation>()
let cycleById = new Map<string, CropCycle>()

function rebuild() {
  fieldById = new Map(fields.map((field) => [field.id, field]))
  farmById = new Map(farms.map((farm) => [farm.id, farm]))
  memberById = new Map(team.map((member) => [member.id, member]))
  surveyById = new Map(surveys.map((survey) => [survey.id, survey]))
  observationById = new Map(observations.map((observation) => [observation.id, observation]))
  cycleById = new Map(seed.cropCycles.map((cycle) => [cycle.id, cycle]))
}

export function initWorkspace(data: Seed) {
  state = data
  seed = data
  organization = data.organization
  farms = data.farms
  fields = data.fields
  team = data.team
  surveys = data.surveys
  observations = data.observations
  actions = data.actions
  reports = data.reports
  events = data.events
  rebuild()
}

/** Prefer the API, fall back to the fixture. Called once before the app renders. */
export async function loadWorkspace(): Promise<"api" | "fixture"> {
  try {
    const response = await fetch("/api/bootstrap")
    if (!response.ok) throw new Error(`status ${response.status}`)
    const data = (await response.json()) as Seed
    if (!data?.farms?.length) throw new Error("empty workspace")
    initWorkspace(data)
    return "api"
  } catch {
    rebuild()
    return "fixture"
  }
}

rebuild()

export const getFarm = (id: string | undefined | null): Farm | undefined =>
  id ? farmById.get(id) : undefined
export const getField = (id: string | undefined | null): Field | undefined =>
  id ? fieldById.get(id) : undefined
export const getMember = (id: string | null | undefined): TeamMember | undefined =>
  id ? memberById.get(id) : undefined
export const getSurvey = (id: string | null | undefined): Survey | undefined =>
  id ? surveyById.get(id) : undefined
export const getObservation = (id: string | null | undefined): Observation | undefined =>
  id ? observationById.get(id) : undefined
export const getCropCycle = (field: Field | undefined): CropCycle | undefined =>
  field?.cropCycleId ? cycleById.get(field.cropCycleId) : undefined

export const fieldsOfFarm = (farmId: string) => fields.filter((f) => f.farmId === farmId)

export const surveysOfField = (fieldId: string) =>
  surveys
    .filter((s) => s.fieldId === fieldId)
    .sort((a, b) => +new Date(b.capturedAt) - +new Date(a.capturedAt))

export const surveysOfFarm = (farmId: string) =>
  surveys
    .filter((s) => s.farmId === farmId)
    .sort((a, b) => +new Date(b.capturedAt) - +new Date(a.capturedAt))

export const latestSurvey = (fieldId: string) =>
  surveysOfField(fieldId).find((s) => s.status === "completed") ?? surveysOfField(fieldId)[0]

export const observationsOfField = (fieldId: string) =>
  observations
    .filter((o) => o.fieldId === fieldId)
    .sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt))

export const actionsOfField = (fieldId: string) =>
  actions
    .filter((a) => a.fieldId === fieldId)
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))

export const reportsOfField = (fieldId: string) => reports.filter((r) => r.fieldId === fieldId)

export const eventsOfField = (fieldId: string) =>
  events.filter((e) => e.fieldId === fieldId).sort((a, b) => +new Date(b.at) - +new Date(a.at))

export const isOpen = (o: Observation) => o.status !== "resolved"
export const isEscalated = (o: Observation) => isOpen(o) && (o.severity === "critical" || o.severity === "high")

export const openObservations = (fieldId?: string) =>
  observations.filter((o) => isOpen(o) && (!fieldId || o.fieldId === fieldId))

export const escalatedObservations = (limit?: number) => {
  const list = observations
    .filter(isEscalated)
    .sort((a, b) => {
      const rank = { critical: 0, high: 1, medium: 2, low: 3 }
      return rank[a.severity] - rank[b.severity] || +new Date(b.detectedAt) - +new Date(a.detectedAt)
    })
  return limit ? list.slice(0, limit) : list
}

export const recentSurveys = (limit = 6) =>
  [...surveys].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)).slice(0, limit)

export const dueActions = (limit?: number) => {
  const list = actions
    .filter((a) => a.status === "todo" || a.status === "in_progress")
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
  return limit ? list.slice(0, limit) : list
}

export const overdueActions = () =>
  dueActions().filter((a) => new Date(a.dueDate).getTime() < Date.now())

// ---------------------------------------------------------------------------
// Derived intelligence: health index built from visual findings
// ---------------------------------------------------------------------------

const severityPenalty = { low: 4, medium: 9, high: 17, critical: 26 } as const

/** Field condition at a point in time, derived from findings recorded up to that date. */
export function fieldScoreAt(fieldId: string, at: Date) {
  const relevant = observations.filter(
    (o) => o.fieldId === fieldId && new Date(o.detectedAt) <= at,
  )
  const penalty = relevant.reduce((sum, o) => sum + severityPenalty[o.severity] * (1 - o.confidence * 0.35), 0)
  return Math.max(18, Math.round(100 - penalty))
}

export function fieldScore(fieldId: string) {
  const status = getField(fieldId)?.status
  if (status === "unverified") return null
  const score = fieldScoreAt(fieldId, new Date())
  return Math.min(100, score)
}

export interface TrendPoint {
  date: string
  label: string
  value: number
}

/** Organization-level crop condition index over the last N weeks. */
export function orgTrend(weeks = 9): TrendPoint[] {
  const points: TrendPoint[] = []
  const now = new Date()
  for (let i = weeks - 1; i >= 0; i--) {
    const at = new Date(now.getTime() - i * 7 * 86_400_000)
    const scored = fields
      .filter((f) => f.status !== "unverified" && getCropCycle(f))
      .map((f) => fieldScoreAt(f.id, at))
    const value = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0
    points.push({
      date: at.toISOString(),
      label: at.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      value,
    })
  }
  return points
}

export function farmTrend(farmId: string, weeks = 9): TrendPoint[] {
  const now = new Date()
  const farmFields = fieldsOfFarm(farmId).filter((f) => f.status !== "unverified")
  const points: TrendPoint[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const at = new Date(now.getTime() - i * 7 * 86_400_000)
    const scored = farmFields.map((f) => fieldScoreAt(f.id, at))
    const value = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0
    points.push({
      date: at.toISOString(),
      label: at.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      value,
    })
  }
  return points
}

/** Vegetation index (NDVI) is only offered for fields with multispectral imagery. */
export function hasMultispectral(fieldId: string) {
  return surveysOfField(fieldId).some((s) => s.sensor === "Multispectral" && s.status === "completed")
}

export interface VegetationPoint {
  surveyId: string
  date: string
  ndvi: number
}

export function vegetationSeries(fieldId: string): VegetationPoint[] | null {
  if (!hasMultispectral(fieldId)) return null
  return surveysOfField(fieldId)
    .filter((s) => s.sensor === "Multispectral" && s.status === "completed")
    .map((s) => {
      let h = 0
      for (let i = 0; i < s.id.length; i++) h = (h * 31 + s.id.charCodeAt(i)) >>> 0
      return {
        surveyId: s.id,
        date: s.capturedAt,
        ndvi: Number((0.56 + (h % 27) / 100).toFixed(2)),
      }
    })
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
}

// ---------------------------------------------------------------------------
// Organization KPIs
// ---------------------------------------------------------------------------

export function organizationKpis(farmId?: string) {
  const farmScope = farmId ? farms.filter((f) => f.id === farmId) : farms
  const fieldScope = farmId ? fields.filter((f) => f.farmId === farmId) : fields
  const cultivated = farmScope.reduce((sum, f) => sum + f.totalAreaHa, 0)
  const activeFields = fieldScope.filter((f) => getCropCycle(f)).length
  const attention = escalatedObservations().filter((o) => !farmId || o.farmId === farmId).length
  const lastInspection = surveys
    .filter((s) => s.status === "completed" && (!farmId || s.farmId === farmId))
    .sort((a, b) => +new Date(b.capturedAt) - +new Date(a.capturedAt))[0]
  return {
    farmCount: farmScope.length,
    cultivatedHa: cultivated,
    fieldCount: fieldScope.length,
    activeFields,
    attention,
    lastInspection,
    openActions: dueActions().filter((a) => !farmId || a.farmId === farmId).length,
    overdue: overdueActions().filter((a) => !farmId || a.farmId === farmId).length,
  }
}

export function cropDistribution(farmId?: string) {
  const totals = new Map<string, number>()
  for (const field of fields) {
    if (farmId && field.farmId !== farmId) continue
    const cycle = getCropCycle(field)
    if (!cycle) continue
    totals.set(cycle.crop, (totals.get(cycle.crop) ?? 0) + field.areaHa)
  }
  return [...totals.entries()]
    .map(([crop, ha]) => ({ crop, ha: Math.round(ha) }))
    .sort((a, b) => b.ha - a.ha)
}

export interface WeeklyCount {
  label: string
  value: number
}

/** Observations detected in each of the last N seven-day windows. */
export function findingsByWeek(weeks = 9, farmId?: string): WeeklyCount[] {
  const now = new Date()
  const out: WeeklyCount[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now)
    end.setDate(now.getDate() - i * 7)
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    const value = observations.filter((o) => {
      if (farmId && o.farmId !== farmId) return false
      const at = new Date(o.detectedAt).getTime()
      return at >= start.getTime() && at <= end.getTime()
    }).length
    out.push({
      label: end.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      value,
    })
  }
  return out
}

/** Completed surveys captured in each of the last N seven-day windows. */
export function surveysByWeek(weeks = 9): WeeklyCount[] {
  const now = new Date()
  const out: WeeklyCount[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now)
    end.setDate(now.getDate() - i * 7)
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    const value = surveys.filter((s) => {
      if (s.status !== "completed") return false
      const at = new Date(s.capturedAt).getTime()
      return at >= start.getTime() && at <= end.getTime()
    }).length
    out.push({
      label: end.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      value,
    })
  }
  return out
}

export function findingsSummary(farmId?: string) {
  const scoped = observations.filter((o) => !farmId || o.farmId === farmId)
  const open = scoped.filter(isOpen)
  return {
    open: open.length,
    escalated: open.filter((o) => o.severity === "critical" || o.severity === "high").length,
    awaitingReview: open.filter((o) => o.status === "under_review").length,
    resolved: scoped.filter((o) => o.status === "resolved").length,
  }
}

export function surveyCounts() {
  return {
    total: surveys.length,
    processing: surveys.filter((s) =>
      ["uploading", "validating", "processing", "analyzing"].includes(s.status),
    ).length,
    queued: surveys.filter((s) => s.status === "queued").length,
    failed: surveys.filter((s) => s.status === "failed").length,
    analyzed: surveys.filter((s) => s.status === "completed").length,
  }
}
