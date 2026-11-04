/**
 * Generates src/data/seed.json — the static demo dataset for the Seagle frontend.
 *
 * Deterministic: same seed in, same data out (dates are anchored to the day the
 * script runs, so re-run `npm run seed` before a demo to keep the timeline fresh).
 */
import { writeFileSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20261103)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min
const round = (n, d = 1) => Number(n.toFixed(d))

const NOW = new Date()
const DAY = 86_400_000

function isoAt(daysAgo, hour = 9, minute = 0) {
  const d = new Date(NOW.getTime() - daysAgo * DAY)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}
const dateAt = (daysAgo) => isoAt(daysAgo).slice(0, 10)

const M_PER_DEG_LAT = 110_574
const mLng = (lat) => 111_320 * Math.cos((lat * Math.PI) / 180)

function ringAreaHa(ring) {
  const lat = ring[0][1]
  const xs = ring.map((p) => p[0] * mLng(lat))
  const ys = ring.map((p) => p[1] * M_PER_DEG_LAT)
  let sum = 0
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    sum += xs[i] * ys[j] - xs[j] * ys[i]
  }
  return round(Math.abs(sum / 2) / 10_000, 1)
}

function centroid(ring) {
  const lat = ring[0][1]
  const xs = ring.map((p) => p[0] * mLng(lat))
  const ys = ring.map((p) => p[1] * M_PER_DEG_LAT)
  let a = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    const cross = xs[i] * ys[j] - xs[j] * ys[i]
    a += cross
    cx += (xs[i] + xs[j]) * cross
    cy += (ys[i] + ys[j]) * cross
  }
  a *= 0.5
  cx /= 6 * a
  cy /= 6 * a
  return [round(cx / mLng(lat), 6), round(cy / M_PER_DEG_LAT, 6)]
}

/** Rectangular field with jittered corners, centred on [lng, lat]. */
function fieldRing([lng, lat], widthM, heightM, scale = 1) {
  const hw = (widthM / 2) * scale
  const hh = (heightM / 2) * scale
  const j = () => (rand() - 0.5) * Math.min(hw, hh) * 0.14
  const pts = [
    [-hw + j(), -hh + j()],
    [hw + j(), -hh + j()],
    [hw + j(), hh + j()],
    [-hw + j(), hh + j()],
  ]
  return pts.map(([x, y]) => [
    round(lng + x / mLng(lat), 6),
    round(lat + y / M_PER_DEG_LAT, 6),
  ])
}

function zoneRing(field, radiusM, at = [rand(), rand()]) {
  const [cx, cy] = centroid(field.boundary)
  const [w, h] = [
    Math.abs(field.boundary[1][0] - field.boundary[0][0]),
    Math.abs(field.boundary[2][1] - field.boundary[0][1]),
  ]
  const zx = cx + (at[0] - 0.5) * w * 0.5
  const zy = cy + (at[1] - 0.5) * h * 0.5
  const pts = []
  const sides = randInt(6, 8)
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2
    const r = radiusM * (0.75 + rand() * 0.5)
    pts.push([round(zx + (Math.cos(a) * r) / mLng(cy), 6), round(zy + (Math.sin(a) * r) / M_PER_DEG_LAT, 6)])
  }
  return pts
}

const sub = (days) => days // readability at call sites

// ---------------------------------------------------------------------------
// organizations, people
// ---------------------------------------------------------------------------

const organization = {
  id: "org_rva",
  name: "Rift Valley Agriculture",
  legalName: "Rift Valley Agriculture Ltd.",
  country: "Kenya",
  region: "Rift Valley",
  timezone: "Africa/Nairobi",
  plan: "Operations",
  createdAt: isoAt(420),
}

const team = [
  { id: "usr_amara", name: "Amara Njeri", role: "Organization owner", email: "amara@riftvalley.ag", phone: "+254 700 118 402", farms: [], status: "active", lastActive: isoAt(0, 7, 12), invites: 0 },
  { id: "usr_david", name: "David Otieno", role: "Farm manager", email: "david@riftvalley.ag", phone: "+254 711 204 887", farms: ["farm_kilima"], status: "active", lastActive: isoAt(0, 6, 48) },
  { id: "usr_grace", name: "Grace Wanjiru", role: "Agronomist", email: "grace@riftvalley.ag", phone: "+254 722 663 019", farms: ["farm_kilima", "farm_nyota"], status: "active", lastActive: isoAt(0, 8, 5) },
  { id: "usr_peter", name: "Peter Mwangi", role: "Field supervisor", email: "peter@riftvalley.ag", phone: "+254 733 550 771", farms: ["farm_kilima", "farm_baraka"], status: "active", lastActive: isoAt(1, 17, 40) },
  { id: "usr_faith", name: "Faith Achieng", role: "Field worker", email: "faith@riftvalley.ag", phone: "+254 744 091 226", farms: ["farm_nyota"], status: "active", lastActive: isoAt(0, 7, 2) },
  { id: "usr_samuel", name: "Samuel Kiptoo", role: "Read-only viewer", email: "samuel@riftvalley.ag", phone: "+254 755 330 118", farms: [], status: "invited", lastActive: null },
]

// ---------------------------------------------------------------------------
// farms + fields
// ---------------------------------------------------------------------------

const farmSpecs = [
  {
    id: "farm_kilima",
    name: "Kilima Farm",
    region: "Nakuru County",
    center: [36.17, -0.2],
    cols: 4,
    rows: 2,
    cell: [960, 700],
    crop: "Maize",
    soil: "Clay loam",
    managerId: "usr_david",
  },
  {
    id: "farm_nyota",
    name: "Nyota Farm",
    region: "Narok County",
    center: [35.83, -1.05],
    cols: 2,
    rows: 2,
    cell: [900, 680],
    crop: "Wheat",
    soil: "Sandy loam",
    managerId: "usr_grace",
  },
  {
    id: "farm_baraka",
    name: "Baraka Farm",
    region: "Uasin Gishu County",
    center: [35.1, 0.6],
    cols: 2,
    rows: 2,
    cell: [880, 640],
    crop: "Potato",
    soil: "Volcanic loam",
    managerId: "usr_peter",
  },
]

const fieldNames = {
  farm_kilima: ["Acacia Block", "North Ridge", "Riverside", "Kilima East", "Mlima Plot", "Dam Field", "School Block", "Boundary Strip"],
  farm_nyota: ["Nyota North", "Nyota South", "Windmill Block", "Olkeri Plot"],
  farm_baraka: ["Baraka Home", "Baraka West", "Sugut Block", "Kapsoya Plot"],
}

const cropSpecs = {
  Maize: { varieties: ["DH04", "SC Duma 43", "Pannar 53"], stages: ["Vegetative (V8)", "Tasselling (VT)", "Grain filling (R3)", "Maturity (R6)"] },
  Wheat: { varieties: ["Kenya Eagle 10", "Kenya Robin", "Njoro BW II"], stages: ["Tillering", "Stem elongation", "Heading", "Grain filling"] },
  Potato: { varieties: ["Shangi", "Unica", "Tigoni"], stages: ["Vegetative", "Tuber initiation", "Tuber bulking"] },
  Beans: { varieties: ["Rosecoco", "Mwitemania"], stages: ["Flowering", "Pod filling"] },
}

const farms = []
const fields = []
const cropCycles = []

for (const spec of farmSpecs) {
  const [clng, clat] = spec.center
  const farmFields = []
  const cols = spec.cols
  const rows = spec.rows
  const gapM = 130

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c
      const nx = (c - (cols - 1) / 2) * (spec.cell[0] + gapM)
      const ny = (r - (rows - 1) / 2) * (spec.cell[1] + gapM)
      const lng = clng + nx / mLng(clat)
      const lat = clat + ny / M_PER_DEG_LAT
      const scale = 0.72 + rand() * 0.24
      const boundary = fieldRing([lng, lat], spec.cell[0], spec.cell[1], scale)
      const areaHa = ringAreaHa(boundary)
      const crop = index === 3 && spec.crop === "Maize" ? "Beans" : spec.crop
      const cycle = cropSpecs[crop]

      const field = {
        id: `fld_${spec.id.replace("farm_", "")}_${String(index + 1).padStart(2, "0")}`,
        farmId: spec.id,
        name: fieldNames[spec.id][index],
        code: `FLD-${spec.id.slice(5, 7).toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
        areaHa,
        boundary,
        centroid: centroid(boundary),
        status: "healthy",
        irrigation: index % 3 === 0 ? "Pivot" : index % 3 === 1 ? "Drip" : "Rain-fed",
        soil: spec.soil,
        createdAt: isoAt(400 - index * 7),
      }

      // Fallow field to exercise the "no active crop cycle" empty state.
      const fallow = spec.id === "farm_baraka" && index === 3
      const cycleId = fallow ? null : `cyc_${field.id.slice(4)}`
      field.cropCycleId = cycleId

      if (cycleId) {
        const planted = index % 2 === 0 ? 26 : 104
        cropCycles.push({
          id: cycleId,
          fieldId: field.id,
          crop,
          variety: pick(cycle.varieties),
          season: planted < 60 ? "Short rains 2026" : "Long rains 2026",
          plantingDate: dateAt(planted),
          expectedHarvest: dateAt(planted - (crop === "Potato" ? 100 : 150)),
          growthStage: cycle.stages[Math.min(cycle.stages.length - 1, Math.floor((planted / 120) * cycle.stages.length))],
          population: crop === "Maize" ? randInt(48, 58) * 1000 : null,
          status: "active",
        })
      }

      fields.push(field)
      farmFields.push(field)
    }
  }

  const lngs = farmFields.flatMap((f) => f.boundary.map((p) => p[0]))
  const lats = farmFields.flatMap((f) => f.boundary.map((p) => p[1]))
  const margin = 0.0022
  const boundary = [
    [round(Math.min(...lngs) - margin, 6), round(Math.min(...lats) - margin, 6)],
    [round(Math.max(...lngs) + margin, 6), round(Math.min(...lats) - margin * 0.8, 6)],
    [round(Math.max(...lngs) + margin * 0.7, 6), round(Math.max(...lats) + margin, 6)],
    [round(Math.min(...lngs) - margin * 0.6, 6), round(Math.max(...lats) + margin * 0.9, 6)],
  ]

  farms.push({
    id: spec.id,
    organizationId: organization.id,
    name: spec.name,
    region: spec.region,
    country: "Kenya",
    managerId: spec.managerId,
    primaryCrop: spec.crop,
    totalAreaHa: round(farmFields.reduce((s, f) => s + f.areaHa, 0), 1),
    fieldCount: farmFields.length,
    centroid: centroid(boundary),
    boundary,
    status: "active",
    rainfall: spec.id === "farm_nyota" ? "520 mm/yr" : "780 mm/yr",
    elevation: spec.id === "farm_baraka" ? "2,140 m" : "1,860 m",
    createdAt: isoAt(400),
  })
}

// ---------------------------------------------------------------------------
// surveys
// ---------------------------------------------------------------------------

const surveys = []
const assets = []
const surveyStatuses = [
  "completed", "completed", "completed", "completed", "completed", "completed",
  "completed", "completed", "completed", "completed", "completed", "completed",
  "processing", "queued", "failed", "validating",
]

const pilots = ["Peter Mwangi", "Faith Achieng", "Samuel Kiptoo"]
const surveySequence = []

let surveyCounter = 0
for (const field of fields) {
  const farm = farms.find((f) => f.id === field.farmId)
  const planned = field.id.endsWith("04") || field.id.endsWith("01") ? 3 : 2
  const hasCycle = Boolean(field.cropCycleId)

  for (let i = 0; i < planned; i++) {
    if (!hasCycle && i > 0) continue
    surveyCounter += 1
    const id = `srv_${String(surveyCounter).padStart(3, "0")}`
    const ageDays = i === 0 ? randInt(2, 6) : i === 1 ? randInt(18, 24) : randInt(36, 44)
    const state = i === 0 ? pick(surveyStatuses) : "completed"
    const multispectralField = ["fld_kilima_01", "fld_kilima_02", "fld_kilima_03", "fld_kilima_04"].includes(field.id)
    const sensor = multispectralField && i === 1 ? "Multispectral" : field.id === "fld_kilima_02" && i === 0 ? "Thermal" : "RGB"
    let status = state
    if (field.id === "fld_kilima_07") status = i === 0 ? "processing" : "queued"
    if (field.id === "fld_baraka_02" && i === 0) status = "failed"

    const completed = status === "completed"
    const hasGeo = completed ? !(secondsHash(field.id) % 9 === 0) : true

    const survey = {
      id,
      fieldId: field.id,
      farmId: field.farmId,
      name: `${field.name} · ${sensor === "RGB" ? "RGB survey" : sensor === "Multispectral" ? "Multispectral pass" : "Thermal pass"}`,
      capturedAt: isoAt(ageDays, 7, 20),
      uploadedAt: isoAt(ageDays, 11, 5),
      pilot: pick(pilots),
      platform: "DJI Mavic 3M",
      sensor,
      status,
      progress: completed ? 100 : status === "processing" ? 64 : status === "validating" ? 22 : status === "queued" ? 0 : 41,
      hasGeo,
      altitudeM: randInt(38, 62),
      coverageHa: round(field.areaHa * (0.82 + rand() * 0.16), 1),
      imageCount: randInt(84, 460),
      durationMin: randInt(9, 24),
      findingsCount: 0,
      startedAt: isoAt(ageDays, 11, 6),
      completedAt: completed ? isoAt(ageDays, 11, 40) : null,
      failureReason:
        status === "failed"
          ? "GeoTIFF could not be georeferenced: the file is missing a coordinate reference system."
          : null,
      notes: !hasGeo ? "Video-only upload. Observations are not mapped to field coordinates." : null,
    }

    const kinds = survey.sensor === "Multispectral"
      ? ["orthomosaic", "geotiff", "image", "image"]
      : ["image", "image", "video"]
    survey.assets = kinds.map((kind, ai) => ({
      id: `${id}_ast_${ai + 1}`,
      kind,
      name:
        kind === "orthomosaic"
          ? `${field.code}_ortho.tif`
          : kind === "geotiff"
            ? `${field.code}_multispectral.tif`
            : kind === "video"
              ? `${field.code}_pass.mp4`
              : `${field.code}_${String(randInt(1000, 9999))}.jpg`,
      sizeMb: kind === "video" ? randInt(420, 980) : kind === "geotiff" ? randInt(180, 420) : randInt(8, 26),
      width: kind === "video" ? 3840 : 5280,
      height: kind === "video" ? 2160 : 3956,
      seed: `${id}-${ai}`,
      capturedAt: survey.capturedAt,
    }))
    assets.push(...survey.assets)

    surveys.push(survey)
    surveySequence.push(survey)
  }
}

function secondsHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

// ---------------------------------------------------------------------------
// observations
// ---------------------------------------------------------------------------

const templates = [
  {
    category: "Disease symptoms",
    observation: "Chlorotic streaking across roughly {pct}% of plants in the {quad} of the field, with distinct lesion margins.",
    interpretation: "Pattern is consistent with early maize streak pressure. Not confirmed — aerial RGB cannot identify the pathogen.",
    recommendation: "Scout 10 plants across the affected zone within 48 hours and capture close-up images for agronomist review.",
    severities: ["high", "medium"],
    confidence: [0.62, 0.91],
  },
  {
    category: "Pest damage",
    observation: "Window-pane feeding damage on whorl leaves across {pct}% of the sampled canopy.",
    interpretation: "Consistent with fall armyworm larval activity. Species is not confirmed from aerial imagery.",
    recommendation: "Check five whorls per hectare for larvae and frass before any treatment decision.",
    severities: ["high", "critical"],
    confidence: [0.7, 0.94],
  },
  {
    category: "Weed presence",
    observation: "Dense broadleaf patches between rows along the {quad} strip, visible below the crop canopy.",
    interpretation: "Possible reduced canopy competition from uneven emergence or missed spray passes.",
    recommendation: "Ground-truth the strip and reconcile the area against the spray log for this cycle.",
    severities: ["low", "medium"],
    confidence: [0.66, 0.88],
  },
  {
    category: "Crop gaps",
    observation: "Bare-soil gaps following two planting rows, roughly {pct}% of the stand.",
    interpretation: "Suspected planter skip or germination failure; the pattern follows row direction.",
    recommendation: "Count plants per metre in three rows and check planter calibration records.",
    severities: ["medium", "high"],
    confidence: [0.74, 0.95],
  },
  {
    category: "Growth variability",
    observation: "Canopy height differs by about {pct}% between the {quad} and the opposite half of the field.",
    interpretation: "Could reflect soil depth, drainage or uneven irrigation. Imagery alone cannot separate these causes.",
    recommendation: "Compare against the soil map and last season's yield map before intervening.",
    severities: ["low", "medium"],
    confidence: [0.6, 0.83],
  },
  {
    category: "Discoloration",
    observation: "Yellowing visible across a {zone} ha patch near the drainage line.",
    interpretation: "Possible nutrient stress or waterlogging — both plausible, not distinguishable from RGB imagery.",
    recommendation: "Sample soil at three points and inspect drainage after the next significant rain.",
    severities: ["medium"],
    confidence: [0.58, 0.8],
  },
  {
    category: "Water stress indicators",
    observation: "Lower canopy reflectance and visible wilting in the {quad} sandy ridge area.",
    interpretation: "Potential water stress. Requires soil moisture or thermal data to confirm.",
    recommendation: "Take a moisture reading at the ridge and compare against the irrigation schedule.",
    severities: ["medium", "high"],
    confidence: [0.64, 0.87],
  },
  {
    category: "Nutrient stress indicators",
    observation: "Pale lower leaves with a uniform pattern across the {quad} block.",
    interpretation: "Possible nitrogen deficiency. Tissue sampling is required before any application.",
    recommendation: "Collect leaf tissue from 12 plants; hold the fertiliser decision until results are in.",
    severities: ["low", "medium"],
    confidence: [0.61, 0.85],
  },
]

const quadrants = ["north-east quadrant", "north-west corner", "south-east quadrant", "south-west strip"]
const observations = []
let obsCounter = 0

const healthyFields = ["fld_kilima_06", "fld_nyota_02", "fld_baraka_03"]
const weightedSeverity = () => {
  const r = rand()
  return r < 0.1 ? "low" : r < 0.55 ? "medium" : r < 0.95 ? "high" : "critical"
}

for (const survey of surveys) {
  if (survey.status !== "completed") continue
  const field = fields.find((f) => f.id === survey.fieldId)
  if (!field.cropCycleId) continue
  if (healthyFields.includes(field.id)) continue
  // Some analysed surveys deliberately produce no findings.
  const silent = field.id === "fld_kilima_03" && survey.name.includes("RGB")
  const count = silent ? 0 : secondsHash(survey.id) % 7 < 3 ? 0 : randInt(1, 2)

  for (let i = 0; i < count; i++) {
    obsCounter += 1
    const template = templates[(obsCounter + i) % templates.length]
    const severity = weightedSeverity()
    const pct = randInt(8, 34)
    const fill = (text) =>
      text
        .replace("{pct}", String(pct))
        .replace("{quad}", pick(quadrants))
        .replace("{zone}", String(round(0.2 + rand() * 0.9, 1)))

    const id = `obs_${String(obsCounter).padStart(3, "0")}`
    const zone = template.category === "Crop gaps" ? null : zoneRing(field, randInt(28, 74))
    const previous = observations.find(
      (o) => o.fieldId === field.id && o.category === template.category && o.status !== "resolved",
    )
    const status = previous
      ? "recurring"
      : severity === "critical"
        ? "under_review"
        : pick(["new", "new", "under_review", "unverified"])

    observations.push({
      id,
      fieldId: field.id,
      farmId: field.farmId,
      surveyId: survey.id,
      title: `${template.category} — ${field.name}`,
      category: template.category,
      severity,
      confidence: round(template.confidence[0] + rand() * (template.confidence[1] - template.confidence[0]), 2),
      status,
      detectedAt: survey.capturedAt,
      zone,
      areaHa: zone ? round((Math.PI * 55 * 55) / 10_000, 2) : null,
      evidenceAssetId: survey.assets.find((a) => a.kind === "image")?.id ?? survey.assets[0].id,
      observation: fill(template.observation),
      interpretation: fill(template.interpretation),
      recommendation: fill(template.recommendation),
      previousObservationId: previous?.id ?? null,
      reviewedBy: status === "under_review" ? "usr_grace" : null,
      reviewNote:
        status === "under_review"
          ? "Flagged for agronomist review. Not yet verified in the field."
          : null,
      resolvedAt: null,
      model: "Muse Spark (vision)",
      modelRunAt: survey.completedAt,
    })

    survey.findingsCount += 1
  }
}

// Some older findings were checked in the field and closed.
const resolvable = observations
  .filter((o) => Date.now() - new Date(o.detectedAt).getTime() > 18 * 86_400_000)
  .sort((a, b) => +new Date(a.detectedAt) - +new Date(b.detectedAt))
for (let i = 0; i < Math.min(4, resolvable.length); i++) {
  const obs = resolvable[i * 3] ?? resolvable[i]
  if (!obs || obs.resolvedAt) continue
  const resolvedAt = new Date(new Date(obs.detectedAt).getTime() + 7 * 86_400_000)
  if (resolvedAt.getTime() > Date.now()) continue
  obs.status = "resolved"
  obs.resolvedAt = resolvedAt.toISOString()
  obs.reviewedBy = "usr_peter"
  obs.reviewNote = "Checked in the field, treated and closed."
}

// Guarantee a couple of critical findings so the escalation path is visible.
const priorityCategories = ["Pest damage", "Disease symptoms", "Water stress indicators"]
for (const farmId of ["farm_kilima", "farm_nyota", "farm_baraka"]) {
  const first = observations.find((o) => o.farmId === farmId && o.status !== "resolved")
  if (first) {
    first.severity = "critical"
    first.status = "under_review"
    first.confidence = Math.max(first.confidence, 0.86)
    if (!priorityCategories.includes(first.category)) first.category = "Pest damage"
    first.title = `${first.category} — ${fields.find((f) => f.id === first.fieldId).name}`
  }
}

// Derived field status from open observations.
for (const field of fields) {
  const open = observations.filter((o) => o.fieldId === field.id && o.status !== "resolved")
  const hasSurvey = surveys.some((s) => s.fieldId === field.id && s.status === "completed")
  if (!hasSurvey) field.status = "unverified"
  else if (open.some((o) => o.severity === "critical")) field.status = "critical"
  else if (open.some((o) => o.severity === "high")) field.status = "attention"
  else if (open.length > 0) field.status = "review"
  else field.status = "healthy"
}

// ---------------------------------------------------------------------------
// actions
// ---------------------------------------------------------------------------

const actionTemplates = [
  { title: "Scout the affected zone for larvae", desc: "Walk a W pattern across the flagged zone, inspect five whorls per hectare and record larval counts." },
  { title: "Collect leaf tissue samples", desc: "Take 12 leaf samples from the flagged block and submit them to the lab for nutrient analysis." },
  { title: "Re-check drainage after rainfall", desc: "Inspect the drainage line 24 hours after the next rain and photograph any standing water." },
  { title: "Count plants per metre", desc: "Measure establishment in three rows and compare against the planter calibration log." },
  { title: "Photograph the affected canopy", desc: "Capture close-up images of the flagged plants, including a scale reference." },
  { title: "Confirm spray record for the block", desc: "Reconcile the spray log with the weed patches visible in the latest survey." },
]

const actions = []
const assignees = ["usr_peter", "usr_faith", "usr_grace"]
const actionStatuses = ["todo", "in_progress", "completed", "verified"]

for (let i = 0; i < 14; i++) {
  const obs = observations[(i * 3) % observations.length]
  const field = fields.find((f) => f.id === obs.fieldId)
  const template = actionTemplates[i % actionTemplates.length]
  const status = i < 5 ? "todo" : i < 8 ? "in_progress" : i < 11 ? "completed" : "verified"
  const dueOffset = status === "todo" || status === "in_progress" ? randInt(-4, 9) : -randInt(6, 20)

  actions.push({
    id: `tsk_${String(i + 1).padStart(3, "0")}`,
    title: template.title,
    description: template.desc,
    fieldId: field.id,
    farmId: field.farmId,
    observationId: obs.id,
    assigneeId: assignees[i % assignees.length],
    priority: ["high", "medium", "low", "medium"][i % 4],
    status,
    dueDate: dateAt(-dueOffset),
    createdAt: isoAt(Math.abs(dueOffset) + 4, 8, 30),
    completedAt: status === "completed" || status === "verified" ? isoAt(Math.max(1, -dueOffset - 1), 16, 10) : null,
    verifiedAt: status === "verified" ? isoAt(Math.max(1, -dueOffset - 2), 9, 45) : null,
    evidence: status === "verified" ? "Photo evidence attached by assignee" : null,
  })
}

// ---------------------------------------------------------------------------
// reports
// ---------------------------------------------------------------------------

const reports = [
  {
    id: "rpt_001", type: "Farm inspection report", title: "Kilima Farm — October inspection summary",
    farmId: "farm_kilima", fieldId: null, periodStart: dateAt(40), periodEnd: dateAt(4),
    createdAt: isoAt(4, 15, 20), createdBy: "usr_david", status: "ready", reviewed: true, pages: 14,
  },
  {
    id: "rpt_002", type: "Field health report", title: "North Ridge — crop health comparison",
    farmId: "farm_kilima", fieldId: "fld_kilima_02", periodStart: dateAt(50), periodEnd: dateAt(3),
    createdAt: isoAt(3, 12, 5), createdBy: "usr_grace", status: "ready", reviewed: true, pages: 8,
  },
  {
    id: "rpt_003", type: "Drone survey report", title: "Nyota North — multispectral pass",
    farmId: "farm_nyota", fieldId: "fld_nyota_01", periodStart: dateAt(30), periodEnd: dateAt(20),
    createdAt: isoAt(20, 9, 40), createdBy: "usr_grace", status: "draft", reviewed: false, pages: 6,
  },
  {
    id: "rpt_004", type: "Outstanding issues report", title: "Open observations older than 14 days",
    farmId: null, fieldId: null, periodStart: dateAt(60), periodEnd: dateAt(0),
    createdAt: isoAt(1, 8, 15), createdBy: "usr_amara", status: "ready", reviewed: false, pages: 5,
  },
]

// ---------------------------------------------------------------------------
// timeline
// ---------------------------------------------------------------------------

const events = []

for (const survey of surveys) {
  const field = fields.find((f) => f.id === survey.fieldId)
  events.push({
    id: `evt_${survey.id}_up`,
    farmId: survey.farmId,
    fieldId: survey.fieldId,
    at: survey.uploadedAt,
    kind: "survey",
    title: `${survey.sensor} survey uploaded`,
    detail: `${field.name} · ${survey.imageCount} images · ${survey.coverageHa} ha covered`,
    actorId: survey.pilot === "Peter Mwangi" ? "usr_peter" : survey.pilot === "Faith Achieng" ? "usr_faith" : "usr_grace",
  })
  if (survey.status === "completed") {
    events.push({
      id: `evt_${survey.id}_done`,
      farmId: survey.farmId,
      fieldId: survey.fieldId,
      at: survey.completedAt,
      kind: "analysis",
      title: survey.findingsCount > 0 ? `${survey.findingsCount} observation${survey.findingsCount === 1 ? "" : "s"} generated` : "Analysis completed without findings",
      detail: field.name,
      actorId: "usr_grace",
    })
  }
  if (survey.status === "failed") {
    events.push({
      id: `evt_${survey.id}_fail`,
      farmId: survey.farmId,
      fieldId: survey.fieldId,
      at: survey.completedAt ?? survey.uploadedAt,
      kind: "system",
      title: "Survey processing failed",
      detail: survey.failureReason,
      actorId: null,
    })
  }
}

for (const action of actions) {
  events.push({
    id: `evt_${action.id}`,
    farmId: action.farmId,
    fieldId: action.fieldId,
    at: action.completedAt ?? action.createdAt,
    kind: "action",
    title: action.status === "completed" || action.status === "verified" ? `Task completed: ${action.title}` : `Task created: ${action.title}`,
    detail: `Assigned to ${team.find((t) => t.id === action.assigneeId)?.name ?? "unassigned"}`,
    actorId: action.assigneeId,
  })
}

for (const report of reports) {
  events.push({
    id: `evt_${report.id}`,
    farmId: report.farmId,
    fieldId: report.fieldId,
    at: report.createdAt,
    kind: "report",
    title: report.title,
    detail: `${report.type} · ${report.pages} pages`,
    actorId: report.createdBy,
  })
}

events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

// ---------------------------------------------------------------------------
// write
// ---------------------------------------------------------------------------

const seed = {
  generatedAt: NOW.toISOString(),
  organization,
  team,
  farms,
  fields,
  cropCycles,
  surveys,
  assets,
  observations,
  actions,
  reports,
  events,
}

const out = resolve(__dirname, "../src/data/seed.json")
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(seed, null, 2))

console.log(
  `seed.json written — ${farms.length} farms, ${fields.length} fields, ${surveys.length} surveys, ${observations.length} observations, ${actions.length} actions, ${events.length} events`,
)
