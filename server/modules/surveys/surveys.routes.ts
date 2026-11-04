import { Router } from "express"
import { z } from "zod"
import { db } from "../../db/client"
import { ApiError, asyncHandler } from "../../http/errors"
import { getFieldContext, invalidateWorkspace } from "../workspace/repository"

export const surveysRouter = Router()

const observationSchema = z.object({
  category: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(1),
  observation: z.string().min(1),
  interpretation: z.string().default(""),
  recommendation: z.string().default(""),
  areaShare: z.number().min(0).max(100).default(0),
})

const persistSchema = z.object({
  fieldId: z.string().min(1),
  sensor: z.enum(["RGB", "Multispectral", "Thermal"]).default("RGB"),
  capturedAt: z.string().optional(),
  summary: z.string().default(""),
  limitations: z.array(z.string()).default([]),
  observations: z.array(observationSchema).max(6),
  model: z.string().default("sam-3.1 + muse-spark-1.3"),
})

/** Persist an analysed frame as a survey plus its observations. */
surveysRouter.post(
  "/surveys",
  asyncHandler(async (req, res) => {
    const body = persistSchema.parse(req.body)
    const context = getFieldContext(body.fieldId)
    if (!context) throw new ApiError(404, "field_not_found", "Unknown field")

    const stamp = Date.now()
    const surveyId = `srv_live_${stamp}`
    const capturedAt = body.capturedAt ?? new Date().toISOString()
    const assetId = `${surveyId}_ast_1`

    const asset = {
      id: assetId,
      kind: "image",
      name: `field_frame_${stamp}.jpg`,
      sizeMb: 1,
      width: 0,
      height: 0,
      seed: `${surveyId}-0`,
      capturedAt,
    }

    db.exec("BEGIN")
    try {
      db.prepare(
        `INSERT INTO surveys (id, field_id, farm_id, name, captured_at, uploaded_at, pilot, platform, sensor, status,
          progress, has_geo, altitude_m, coverage_ha, image_count, duration_min, findings_count, started_at, completed_at,
          failure_reason, notes, assets)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', 100, 0, 0, ?, 1, 0, ?, ?, ?, NULL, ?, ?)`,
      ).run(
        surveyId,
        context.field.id,
        context.field.farmId,
        `${context.field.name} · ${body.sensor} frame`,
        capturedAt,
        new Date().toISOString(),
        "Field upload",
        "Meta Model API",
        body.sensor,
        context.field.areaHa,
        body.observations.length,
        new Date().toISOString(),
        new Date().toISOString(),
        body.summary || null,
        JSON.stringify([asset]),
      )

      const insertObservation = db.prepare(
        `INSERT INTO observations (id, field_id, farm_id, survey_id, title, category, severity, confidence, status,
          detected_at, resolved_at, zone, area_ha, evidence_asset_id, observation, interpretation, recommendation,
          previous_observation_id, reviewed_by, review_note, model, model_run_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, NULL, NULL, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
      )

      body.observations.forEach((observation, index) => {
        insertObservation.run(
          `obs_live_${stamp}_${index + 1}`,
          context.field.id,
          context.field.farmId,
          surveyId,
          `${observation.category} — ${context.field.name}`,
          observation.category,
          observation.severity,
          observation.confidence,
          capturedAt,
          (context.field.areaHa * observation.areaShare) / 100,
          assetId,
          observation.observation,
          observation.interpretation,
          observation.recommendation,
          body.model,
          capturedAt,
        )
      })

      db.prepare(
        `INSERT INTO events (id, farm_id, field_id, at, kind, title, detail, actor_id)
         VALUES (?, ?, ?, ?, 'analysis', ?, ?, ?)`,
      ).run(
        `evt_${surveyId}`,
        context.field.farmId,
        context.field.id,
        new Date().toISOString(),
        body.observations.length > 0 ? `${body.observations.length} observation(s) generated` : "Analysis completed without findings",
        body.summary || `${body.sensor} frame analysed`,
        "usr_amara",
      )

      db.exec("COMMIT")
    } catch (error) {
      db.exec("ROLLBACK")
      throw error
    }

    invalidateWorkspace()
    res.status(201).json({ surveyId, fieldId: context.field.id, findings: body.observations.length })
  }),
)
