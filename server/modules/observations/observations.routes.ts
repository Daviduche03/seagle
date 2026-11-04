import { Router } from "express"
import { z } from "zod"
import { db } from "../../db/client"
import { ApiError, asyncHandler } from "../../http/errors"
import { getSeed, invalidateWorkspace } from "../workspace/repository"

export const observationsRouter = Router()

const reviewSchema = z.object({
  status: z.enum(["new", "recurring", "under_review", "resolved", "unverified"]),
  note: z.string().max(500).optional(),
  reviewerId: z.string().optional(),
})

observationsRouter.post(
  "/observations/:id/review",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    const body = reviewSchema.parse(req.body)

    const existing = db.prepare("SELECT id, field_id, farm_id FROM observations WHERE id = ?").get(id) as
      | { id: string; field_id: string; farm_id: string }
      | undefined
    if (!existing) throw new ApiError(404, "observation_not_found", "Unknown observation")

    const reviewer = body.reviewerId ?? "usr_amara"
    db.prepare(
      "UPDATE observations SET status = ?, review_note = ?, reviewed_by = ?, resolved_at = ? WHERE id = ?",
    ).run(
      body.status,
      body.note ?? null,
      reviewer,
      body.status === "resolved" ? new Date().toISOString() : null,
      id,
    )

    db.prepare(
      `INSERT INTO events (id, farm_id, field_id, at, kind, title, detail, actor_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      `evt_${id}_${Date.now()}`,
      existing.farm_id,
      existing.field_id,
      new Date().toISOString(),
      "action",
      `Finding ${body.status.replace("_", " ")}`,
      body.note ?? "Reviewed in the workspace",
      reviewer,
    )

    invalidateWorkspace()
    const observation = getSeed().observations.find((item) => item.id === id)
    res.json({ observation })
  }),
)
