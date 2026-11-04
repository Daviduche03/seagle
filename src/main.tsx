import * as React from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/inter"
import "maplibre-gl/dist/maplibre-gl.css"
import "./index.css"
import { App } from "./App"
import { loadWorkspace } from "./data/store"

const container = document.getElementById("root")!

async function boot() {
  const ready = await loadWorkspace()

  createRoot(container).render(
    <React.StrictMode>
      {ready ? (
        <App />
      ) : (
        <div className="grid min-h-dvh place-items-center bg-background px-6">
          <div className="max-w-sm text-center">
            <p className="text-[15px] font-semibold">Workspace unavailable</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
              The app could not reach its API, so there is nothing to show. Start the server with
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px]">npm start</code>
              and reload.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 h-8 rounded-md bg-primary px-3 text-[12.5px] font-medium text-primary-foreground"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </React.StrictMode>,
  )
}

void boot()
