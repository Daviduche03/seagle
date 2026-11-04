import { createApp } from "./http/app"
import { aiConfigured, env } from "./env"
import { seedDatabase } from "./db/seed"

seedDatabase()

const app = createApp()

app.listen(env.port, () => {
  console.log(`[seagle] api on http://localhost:${env.port}`)
  console.log(`[seagle] model ${env.model} · vision ${env.visionModel} · ai ${aiConfigured ? "ready" : "not configured"}`)
})
