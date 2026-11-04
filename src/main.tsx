import * as React from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/inter"
import "maplibre-gl/dist/maplibre-gl.css"
import "./index.css"
import { App } from "./App"
import { loadWorkspace } from "./data/store"

const container = document.getElementById("root")!

async function boot() {
  // The workspace loads from SQLite behind /api/bootstrap; the bundled fixture
  // is the offline fallback, so the app still renders if the API is down.
  await loadWorkspace()

  createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

void boot()
