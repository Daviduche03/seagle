export type ID = string
export type LatLng = [number, number]
export type Ring = LatLng[]

export type FieldStatus = "healthy" | "review" | "attention" | "critical" | "unverified"
export type Severity = "low" | "medium" | "high" | "critical"
export type ObservationStatus = "new" | "recurring" | "under_review" | "resolved" | "unverified"
export type SurveyStatus =
  | "queued"
  | "uploading"
  | "validating"
  | "processing"
  | "analyzing"
  | "completed"
  | "failed"
export type ActionStatus = "todo" | "in_progress" | "completed" | "verified"
export type Priority = "low" | "medium" | "high"
export type Sensor = "RGB" | "Multispectral" | "Thermal"

export interface Organization {
  id: ID
  name: string
  legalName: string
  country: string
  region: string
  timezone: string
  plan: string
  createdAt: string
}

export interface TeamMember {
  id: ID
  name: string
  role: string
  email: string
  phone: string
  farms: ID[]
  status: "active" | "invited"
  lastActive: string | null
}

export interface Farm {
  id: ID
  organizationId: ID
  name: string
  region: string
  country: string
  managerId: ID
  primaryCrop: string
  totalAreaHa: number
  fieldCount: number
  centroid: LatLng
  boundary: Ring
  status: "active"
  rainfall: string
  elevation: string
  createdAt: string
}

export interface Field {
  id: ID
  farmId: ID
  name: string
  code: string
  areaHa: number
  boundary: Ring
  centroid: LatLng
  status: FieldStatus
  irrigation: string
  soil: string
  cropCycleId: ID | null
  createdAt: string
}

export interface CropCycle {
  id: ID
  fieldId: ID
  crop: string
  variety: string
  season: string
  plantingDate: string
  expectedHarvest: string
  growthStage: string
  population: number | null
  status: "active"
}

export interface SurveyAsset {
  id: ID
  kind: "image" | "video" | "orthomosaic" | "geotiff"
  name: string
  sizeMb: number
  width: number
  height: number
  seed: string
  capturedAt: string
}

export interface Survey {
  id: ID
  fieldId: ID
  farmId: ID
  name: string
  capturedAt: string
  uploadedAt: string
  pilot: string
  platform: string
  sensor: Sensor
  status: SurveyStatus
  progress: number
  hasGeo: boolean
  altitudeM: number
  coverageHa: number
  imageCount: number
  durationMin: number
  findingsCount: number
  startedAt: string
  completedAt: string | null
  failureReason: string | null
  notes: string | null
  assets: SurveyAsset[]
}

export interface Observation {
  id: ID
  fieldId: ID
  farmId: ID
  surveyId: ID
  title: string
  category: string
  severity: Severity
  confidence: number
  status: ObservationStatus
  detectedAt: string
  resolvedAt: string | null
  zone: Ring | null
  areaHa: number | null
  evidenceAssetId: ID
  observation: string
  interpretation: string
  recommendation: string
  previousObservationId: ID | null
  reviewedBy: ID | null
  reviewNote: string | null
  model: string
  modelRunAt: string | null
}

export interface FarmAction {
  id: ID
  title: string
  description: string
  fieldId: ID
  farmId: ID
  observationId: ID
  assigneeId: ID
  priority: Priority
  status: ActionStatus
  dueDate: string
  createdAt: string
  completedAt: string | null
  verifiedAt: string | null
  evidence: string | null
}

export interface Report {
  id: ID
  type: string
  title: string
  farmId: ID | null
  fieldId: ID | null
  periodStart: string
  periodEnd: string
  createdAt: string
  createdBy: ID
  status: "draft" | "ready"
  reviewed: boolean
  pages: number
}

export interface TimelineEvent {
  id: ID
  farmId: ID
  fieldId: ID | null
  at: string
  kind: "survey" | "analysis" | "action" | "report" | "system"
  title: string
  detail: string
  actorId: ID | null
}

export interface Seed {
  generatedAt: string
  organization: Organization
  team: TeamMember[]
  farms: Farm[]
  fields: Field[]
  cropCycles: CropCycle[]
  surveys: Survey[]
  assets: SurveyAsset[]
  observations: Observation[]
  actions: FarmAction[]
  reports: Report[]
  events: TimelineEvent[]
}
