# Seagle

Farm intelligence for commercial farms. Upload a drone frame; get back a short,
verifiable list of findings tied to a field.

Built for the **Meta Global AI Developer Hackathon 2026** with Meta Model API:
**SAM 3.1** for segmentation, **Muse Spark** for reasoning.

---

## The problem

A 40-hectare maize field produces hundreds of drone images. A farm manager does not
need more images — they need to know which field needs a person, why, and where. Seagle
turns surveys into observations with evidence, confidence and a field check, then keeps
the history so the next survey can say whether an issue is new, recurring or resolved.

## The loop

```
farm → field → survey → finding (evidence + confidence) → task → next survey
```

The demo follows one thread: Kilima Farm → Acacia Block → survey → a finding on the
leaf → review → the field history records it.

## Model stack

| Model | Role | Endpoint |
|---|---|---|
| `sam-3.1` | Detect and segment regions (vegetation, leaf, bare soil); returns boxes and coverage | `POST /v1/responses` |
| `muse-spark-1.3` | Read the frame plus the field record; write the observation, the suspected interpretation and the field check | `chat/completions` |

Both use the same Meta Model API key. Segmentation runs first and its measurements are
passed to the reasoning model as facts, not conclusions.

**What the product refuses to do:** call a symptom a diagnosis, show NDVI without
multispectral data, or place an observation on a map when the imagery was not
georeferenced. Missing data becomes an explicit limitation, not a guess.

## Architecture

```
src/                      React 19 + Vite + Tailwind v4
  pages/                  Overview · Farms & Fields · Field Detail · Drone · Monitoring
  components/             design system, maps, findings, dither charts
  data/store.ts           boot-time workspace loader (API first, fixture fallback)

server/                   Express + TypeScript
  db/                     node:sqlite schema, seed, client
  http/                   app, error handling, static SPA
  modules/
    ai/                   Meta Model API provider (AI SDK)
    analysis/             frame → observations (SAM + Muse)
    segmentation/         SAM 3.1 detection and coverage
    assistant/            grounded answers, streamed
    reports/              field report drafts
    observations/         human review writes
    surveys/              persist an analysed frame
    workspace/            the only module that reads the database
```

Each module owns its schema, service and routes. Routes validate and delegate;
services own model calls; `workspace/repository.ts` is the only reader of data.

## Data

SQLite (`data/seagle.db`) via Node's built-in `node:sqlite` — no native module, one
file. Ten tables: organizations, team, farms, fields, crop cycles, surveys,
observations, actions, reports, events.

The database seeds itself on first boot from `server/db/seed.json`, so a fresh deploy
starts with a coherent workspace. The same fixture is bundled into the SPA as an
offline fallback: if the API is unreachable the interface still opens.

The demo workspace is synthetic but internally consistent: 3 farms, 16 fields, 36
surveys, 21 observations. Real imagery and real uploads are the only way to change it.

## API

| Route | Purpose |
|---|---|
| `GET /api/health` | liveness, model ids, whether the key is configured |
| `GET /api/bootstrap` | the workspace, in one payload |
| `POST /api/analysis` | `{ fieldId, image(data URL), sensor }` → segmentation + observations |
| `POST /api/surveys` | persist an analysed frame and its findings |
| `POST /api/observations/:id/review` | confirm / reject / mark uncertain |
| `POST /api/assistant` | structured answer with cited fields |
| `POST /api/assistant/stream` | the same answer, streamed as text |
| `POST /api/reports` | draft a field report |

## Run

```bash
npm install
cp .env.example .env      # add META_API_KEY
npm run dev               # web :5180, api :8787
```

Production:

```bash
npm run build
npm start                 # serves dist/ and /api on :8787
```

The API and the SPA ship as one process. `META_API_KEY`, `META_BASE_URL`,
`META_MODEL`, `META_VISION_MODEL` and `DATABASE_PATH` are the only settings.

## Deploy

The app is one Node process serving `dist/` and `/api`, so any host that runs Node works.
`node:sqlite` needs Node **22.5 or newer**.

**Render** — `render.yaml` is a blueprint: New → Blueprint → pick this repo → set
`META_API_KEY` when prompted. Free plan works; the database reseeds on each deploy
because the filesystem is ephemeral, which is fine for a demo.

**Docker / Fly.io** — a `Dockerfile` is included:

```bash
flyctl apps create <name>
flyctl volumes create seagle_data --region <region> --size 1 -a <name>
flyctl secrets set META_API_KEY=... -a <name>
flyctl deploy -a <name>
```

The volume is mounted at `/data` and `DATABASE_PATH=/data/seagle.db`, so writes survive
restarts.

**Temporary public URL** — for a quick demo without a host:

```bash
npm run build && npm start            # :8787, serves app + api
cloudflared tunnel --url http://localhost:8787
```

That URL lives only while the machine and the tunnel are running.

## Demo path

1. **Overview** — 17 open findings, 8 need a decision.
2. **Farms & Fields** — the map; pick a field.
3. **Field Detail** — identity, map, observation zones, findings.
4. **Drone Intelligence → Upload survey** — attach a frame, watch SAM measure it and
   Muse explain it, then open the field.
5. **Ask Seagle** — "which fields need attention this week".

## Honest limits

- The dataset is synthetic. The pipeline is not: uploads are really segmented and
  really reasoned about, and reviews really write to SQLite.
- SAM masks are returned by the API but rendered as boxes; the mask encoding is not
  documented, so decoding it would be guesswork.
- Model output is nondeterministic at temperature 0.2 — confidence can move a few
  points between runs.
- No authentication or multi-tenancy yet: one organization per deployment.
