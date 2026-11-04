import { existsSync } from "node:fs"
import { resolve } from "node:path"
import cors from "cors"
import express from "express"
import { aiConfigured, env } from "../env"
import { errorHandler } from "./errors"
import { analysisRouter } from "../modules/analysis/analysis.routes"
import { assistantRouter } from "../modules/assistant/assistant.routes"
import { reportsRouter } from "../modules/reports/reports.routes"

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.allOrigins.split(",").map((origin) => origin.trim()) }))
  app.use(express.json({ limit: "15mb" }))

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, ai: aiConfigured, model: env.model, visionModel: env.visionModel })
  })

  app.use("/api", analysisRouter)
  app.use("/api", assistantRouter)
  app.use("/api", reportsRouter)

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "not_found", message: "Unknown API route" })
  })

  // Serve the built SPA when it exists (single-process deploy).
  const dist = resolve(process.cwd(), "dist")
  if (existsSync(dist)) {
    app.use(express.static(dist))
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api")) return next()
      res.sendFile("index.html", { root: dist })
    })
  }

  app.use(errorHandler)
  return app
}
