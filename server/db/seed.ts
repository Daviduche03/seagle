import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { db, ensureSchema } from "./client"

interface SeedShape {
  organization: Record<string, unknown> & { id: string }
  team: Record<string, unknown>[]
  farms: Record<string, unknown>[]
  fields: Record<string, unknown>[]
  cropCycles: Record<string, unknown>[]
  surveys: Record<string, unknown>[]
  observations: Record<string, unknown>[]
  actions: Record<string, unknown>[]
  reports: Record<string, unknown>[]
  events: Record<string, unknown>[]
}

const json = (value: unknown) => JSON.stringify(value ?? null)
const bool = (value: unknown) => (value ? 1 : 0)

/** Load the demo dataset into SQLite once, on first start. */
export function seedDatabase() {
  ensureSchema()

  const row = db.prepare("SELECT COUNT(*) AS count FROM farms").get() as { count: number }
  if (row.count > 0) return

  const seedPath = resolve(process.cwd(), "src/data/seed.json")
  const seed = JSON.parse(readFileSync(seedPath, "utf8")) as SeedShape

  const org = seed.organization
  db.exec("BEGIN")
  try {
    db.prepare(
      `INSERT INTO organizations (id, name, legal_name, country, region, timezone, plan, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      String(org.id),
      String(org.name),
      String(org.legalName),
      String(org.country),
      String(org.region),
      String(org.timezone),
      String(org.plan),
      String(org.createdAt),
    )

    const member = db.prepare(
      `INSERT INTO team_members (id, name, role, email, phone, farms, status, last_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const item of seed.team) {
      member.run(
        String(item.id),
        String(item.name),
        String(item.role),
        String(item.email),
        String(item.phone),
        json(item.farms),
        String(item.status),
        item.lastActive ? String(item.lastActive) : null,
      )
    }

    const farm = db.prepare(
      `INSERT INTO farms (id, organization_id, name, region, country, manager_id, primary_crop, total_area_ha,
        field_count, centroid, boundary, status, rainfall, elevation, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const item of seed.farms) {
      farm.run(
        String(item.id),
        String(item.organizationId),
        String(item.name),
        String(item.region),
        String(item.country),
        String(item.managerId),
        String(item.primaryCrop),
        Number(item.totalAreaHa),
        Number(item.fieldCount),
        json(item.centroid),
        json(item.boundary),
        String(item.status),
        String(item.rainfall),
        String(item.elevation),
        String(item.createdAt),
      )
    }

    const cycle = db.prepare(
      `INSERT INTO crop_cycles (id, field_id, crop, variety, season, planting_date, expected_harvest, growth_stage, population, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const item of seed.cropCycles) {
      cycle.run(
        String(item.id),
        String(item.fieldId),
        String(item.crop),
        String(item.variety),
        String(item.season),
        String(item.plantingDate),
        String(item.expectedHarvest),
        String(item.growthStage),
        item.population == null ? null : Number(item.population),
        String(item.status),
      )
    }

    const field = db.prepare(
      `INSERT INTO fields (id, farm_id, name, code, area_ha, boundary, centroid, status, irrigation, soil, crop_cycle_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const item of seed.fields) {
      field.run(
        String(item.id),
        String(item.farmId),
        String(item.name),
        String(item.code),
        Number(item.areaHa),
        json(item.boundary),
        json(item.centroid),
        String(item.status),
        String(item.irrigation),
        String(item.soil),
        item.cropCycleId ? String(item.cropCycleId) : null,
        String(item.createdAt),
      )
    }

    const survey = db.prepare(
      `INSERT INTO surveys (id, field_id, farm_id, name, captured_at, uploaded_at, pilot, platform, sensor, status,
        progress, has_geo, altitude_m, coverage_ha, image_count, duration_min, findings_count, started_at, completed_at,
        failure_reason, notes, assets)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const item of seed.surveys) {
      survey.run(
        String(item.id),
        String(item.fieldId),
        String(item.farmId),
        String(item.name),
        String(item.capturedAt),
        String(item.uploadedAt),
        String(item.pilot),
        String(item.platform),
        String(item.sensor),
        String(item.status),
        Number(item.progress),
        bool(item.hasGeo),
        Number(item.altitudeM),
        Number(item.coverageHa),
        Number(item.imageCount),
        Number(item.durationMin),
        Number(item.findingsCount),
        String(item.startedAt),
        item.completedAt ? String(item.completedAt) : null,
        item.failureReason ? String(item.failureReason) : null,
        item.notes ? String(item.notes) : null,
        json(item.assets),
      )
    }

    const observation = db.prepare(
      `INSERT INTO observations (id, field_id, farm_id, survey_id, title, category, severity, confidence, status,
        detected_at, resolved_at, zone, area_ha, evidence_asset_id, observation, interpretation, recommendation,
        previous_observation_id, reviewed_by, review_note, model, model_run_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const item of seed.observations) {
      observation.run(
        String(item.id),
        String(item.fieldId),
        String(item.farmId),
        String(item.surveyId),
        String(item.title),
        String(item.category),
        String(item.severity),
        Number(item.confidence),
        String(item.status),
        String(item.detectedAt),
        item.resolvedAt ? String(item.resolvedAt) : null,
        item.zone ? json(item.zone) : null,
        item.areaHa == null ? null : Number(item.areaHa),
        String(item.evidenceAssetId),
        String(item.observation),
        String(item.interpretation),
        String(item.recommendation),
        item.previousObservationId ? String(item.previousObservationId) : null,
        item.reviewedBy ? String(item.reviewedBy) : null,
        item.reviewNote ? String(item.reviewNote) : null,
        String(item.model),
        item.modelRunAt ? String(item.modelRunAt) : null,
      )
    }

    const action = db.prepare(
      `INSERT INTO actions (id, title, description, field_id, farm_id, observation_id, assignee_id, priority, status,
        due_date, created_at, completed_at, verified_at, evidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const item of seed.actions) {
      action.run(
        String(item.id),
        String(item.title),
        String(item.description),
        String(item.fieldId),
        String(item.farmId),
        String(item.observationId),
        String(item.assigneeId),
        String(item.priority),
        String(item.status),
        String(item.dueDate),
        String(item.createdAt),
        item.completedAt ? String(item.completedAt) : null,
        item.verifiedAt ? String(item.verifiedAt) : null,
        item.evidence ? String(item.evidence) : null,
      )
    }

    const report = db.prepare(
      `INSERT INTO reports (id, type, title, farm_id, field_id, period_start, period_end, created_at, created_by, status, reviewed, pages)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const item of seed.reports) {
      report.run(
        String(item.id),
        String(item.type),
        String(item.title),
        item.farmId ? String(item.farmId) : null,
        item.fieldId ? String(item.fieldId) : null,
        String(item.periodStart),
        String(item.periodEnd),
        String(item.createdAt),
        String(item.createdBy),
        String(item.status),
        bool(item.reviewed),
        Number(item.pages),
      )
    }

    const event = db.prepare(
      `INSERT INTO events (id, farm_id, field_id, at, kind, title, detail, actor_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const item of seed.events) {
      event.run(
        String(item.id),
        String(item.farmId),
        item.fieldId ? String(item.fieldId) : null,
        String(item.at),
        String(item.kind),
        String(item.title),
        String(item.detail),
        item.actorId ? String(item.actorId) : null,
      )
    }

    db.exec("COMMIT")
    console.log(
      `[db] seeded ${seed.farms.length} farms, ${seed.fields.length} fields, ${seed.surveys.length} surveys, ${seed.observations.length} observations`,
    )
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }
}
