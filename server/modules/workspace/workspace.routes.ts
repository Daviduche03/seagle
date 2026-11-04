import { Router } from "express"
import { getSeed } from "./repository"

export const workspaceRouter = Router()

/** The whole workspace, shaped exactly like the bundled fixture, so the SPA can
 * boot from the database without a query per screen. */
workspaceRouter.get("/bootstrap", (_req, res) => {
  res.setHeader("Cache-Control", "no-store")
  res.json(getSeed())
})
