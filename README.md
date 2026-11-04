# Seagle

Farm intelligence for commercial farms. Drone imagery goes in; a short, verifiable
list of field findings comes out.

Built for the Meta Global AI Developer Hackathon 2026.

## The loop

Farm → field → survey → findings on the map → evidence and confidence → a field check
→ the next survey, where an issue is new, recurring or resolved.

## Model stack

- **SAM 3.1** — segments canopy, soil and anomalous patches; produces the zone and area.
- **Muse Spark** — multimodal reasoning over the frame; writes the observation, the
  suspected interpretation and the verification step, and answers questions over the
  workspace records.
- **Meta Model API** — OpenAI-compatible endpoint, configured through env vars.

The product never presents a symptom as a diagnosis, never shows NDVI without
multispectral data, and never places an observation on a map when the imagery was not
georeferenced. Those cases become explicit "not available" states.

## Stack

- Frontend: React 19, Vite, Tailwind v4, shadcn-style primitives, dither-kit charts,
  tile map with an SVG field layer (no WebGL).
- Backend: Express + TypeScript, modular by domain, Vercel AI SDK for model calls.
- Data: a deterministic demo dataset (`src/data/seed.json`) shared by both sides.

## Layout

```
server/
  index.ts               bootstrap
  env.ts                 configuration
  http/
    app.ts               express app, static SPA, error handling
    errors.ts            ApiError + async handler
  modules/
    ai/provider.ts       Meta Model API provider
    analysis/            frame → structured observations
    assistant/           grounded Q&A over workspace records
    reports/             field report drafting
    workspace/           read access to the demo dataset
src/                     React app (pages, components, fixtures)
```

Each module owns its schema, prompt, service and routes. Routes only validate and
delegate; services own the model calls; the repository is the only thing that reads data.

## Run

```bash
npm install
cp .env.example .env    # add META_API_KEY (and base URL / model ids if different)
npm run dev             # web on :5180, api on :8787
```

Production:

```bash
npm run build
npm start               # serves dist/ and /api on :8787
```

## API

| Route | Purpose |
|---|---|
| `GET /api/health` | liveness + whether the model key is configured |
| `POST /api/analysis` | `{ fieldId, image (data URL), sensor }` → observations |
| `POST /api/assistant` | `{ question }` → answer + cited fields |
| `POST /api/reports` | `{ fieldId }` → report draft |

If `META_API_KEY` is missing the endpoints return `503 ai_not_configured`; the UI detects
this and stays usable in demo mode.

## Screens

- **Overview** — what needs a decision.
- **Farms & Fields** — directory and map.
- **Field Detail** — identity, map, findings, evidence drawer.
- **Drone Intelligence** — survey pipeline and frame upload.
- **Health & Monitoring** — counts over time.

Crop Intelligence, Actions, Reports, Team and Settings are not exposed in the navigation.

## Honest limits

The bundled dataset is realistic but synthetic. The upload flow runs the vision model on
a supplied frame; each processing stage around it is simulated and labelled as such. No
report is invented: drafts are generated from the field record only.
