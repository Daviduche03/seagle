import * as React from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  ArrowRight,
  Check,
  CircleAlert,
  Clock3,
  FileImage,
  HardDrive,
  Loader2,
  Upload,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/common/status"
import { severityMeta, surveyStatusMeta } from "@/lib/status"
import { formatArea, formatDate, formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Survey } from "@/data/types"
import {
  farms,
  fields,
  getCropCycle,
  getFarm,
  getField,
  observations,
  surveys,
} from "@/data/store"

const STEPS = [
  "Queued",
  "Uploading",
  "Validating metadata",
  "Processing imagery",
  "Running visual analysis",
  "Generating findings",
]

export function DroneIntelligencePage() {
  const [params] = useSearchParams()
  const [uploadOpen, setUploadOpen] = React.useState(params.get("upload") === "1")
  const initialField = params.get("field") ?? ""
  const [farmFilter, setFarmFilter] = React.useState("all")
  const [selected, setSelected] = React.useState<Survey | null>(null)

  const rows = React.useMemo(
    () =>
      [...surveys]
        .filter((survey) => farmFilter === "all" || survey.farmId === farmFilter)
        .sort((a, b) => +new Date(b.capturedAt) - +new Date(a.capturedAt)),
    [farmFilter],
  )

  const processing = surveys.filter((s) => ["queued", "uploading", "validating", "processing", "analyzing"].includes(s.status)).length
  const analyzed = surveys.filter((s) => s.status === "completed").length
  const failed = surveys.filter((s) => s.status === "failed").length

  return (
    <>
      <PageHeader
        title="Drone Intelligence"
        subtitle={`${surveys.length} surveys · ${analyzed} analyzed · ${processing} in progress`}
        actions={
          <Button className="gap-1.5" onClick={() => setUploadOpen(true)}>
            <Upload /> Upload survey
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
        <Stat label="Surveys" value={surveys.length} sub="All time" />
        <Stat label="Analyzed" value={analyzed} sub="Findings generated" />
        <Stat label="In progress" value={processing} sub="Uploading or processing" />
        <Stat label="Failed" value={failed} sub="Needs attention" tone={failed > 0 ? "warning" : "default"} />
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2.5">
          <p className="text-[10.5px] font-semibold tracking-[0.085em] text-[#74817a] uppercase">Surveys</p>
          <Select value={farmFilter} onValueChange={setFarmFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All farms</SelectItem>
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Field</TableHead>
                <TableHead>Sensor</TableHead>
                <TableHead>Captured</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Findings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((survey) => {
                const field = getField(survey.fieldId)!
                const farm = getFarm(survey.farmId)!
                return (
                  <TableRow
                    key={survey.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(survey)}
                  >
                    <TableCell className="pl-4">
                      <span className="block text-[12.5px] font-medium">{field.name}</span>
                      <span className="block text-[10.5px] text-muted-foreground">{farm.name}</span>
                    </TableCell>
                    <TableCell className="text-[11.5px] text-muted-foreground">{survey.sensor}</TableCell>
                    <TableCell className="text-[11.5px] text-muted-foreground tabular">
                      {formatDate(survey.capturedAt)}
                    </TableCell>
                    <TableCell className="text-[11.5px] text-muted-foreground tabular">
                      {formatArea(survey.coverageHa)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge meta={surveyStatusMeta[survey.status]} variant="dot" />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {survey.status === "completed" ? (
                        survey.findingsCount > 0 ? (
                          <span className="text-[12.5px] font-medium tabular">{survey.findingsCount}</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">None</span>
                        )
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SurveySheet survey={selected} onClose={() => setSelected(null)} />
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} initialFieldId={initialField} />
    </>
  )
}

function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string
  value: number
  sub: string
  tone?: "default" | "warning"
}) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="text-[10px] font-semibold tracking-[0.09em] text-[#74817a] uppercase">{label}</p>
      <p className={cn("mt-1.5 text-[20px] leading-none font-semibold tabular", tone === "warning" && "text-warning")}>
        {value}
      </p>
      <p className="mt-1 text-[10.5px] text-muted-foreground">{sub}</p>
    </div>
  )
}

function SurveySheet({ survey, onClose }: { survey: Survey | null; onClose: () => void }) {
  if (!survey) return <Sheet open={false} onOpenChange={onClose} />
  const field = getField(survey.fieldId)!
  const farm = getFarm(survey.farmId)!
  const crop = getCropCycle(field)
  const findings = observations.filter((obs) => obs.surveyId === survey.id)

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent width="480px" className="gap-0">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{field.name}</SheetTitle>
            <StatusBadge meta={surveyStatusMeta[survey.status]} />
          </div>
          <p className="text-[12px] text-muted-foreground">
            {farm.name} · {survey.sensor} · {formatDateTime(survey.capturedAt)}
          </p>
        </SheetHeader>

        <SheetBody className="space-y-5 px-5 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Meta label="Field" value={`${field.name} · ${field.code}`} />
            <Meta label="Crop" value={crop ? `${crop.crop} · ${crop.variety}` : "Fallow"} />
            <Meta label="Coverage" value={formatArea(survey.coverageHa)} />
            <Meta label="Altitude" value={`${survey.altitudeM} m AGL`} />
            <Meta label="Captured" value={formatDate(survey.capturedAt)} />
            <Meta label="Images" value={String(survey.imageCount)} />
            <Meta label="Pilot" value={survey.pilot} />
            <Meta label="Georeferenced" value={survey.hasGeo ? "Yes" : "No — not mapped"} />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Processing
            </p>
            <ol className="space-y-1.5">
              {STEPS.map((step, index) => {
                const done =
                  survey.status === "completed" ||
                  (survey.status === "failed" && index < 3) ||
                  (survey.status === "processing" && index < 4) ||
                  (survey.status === "validating" && index < 2)
                const failed = survey.status === "failed" && index === 3
                return (
                  <li key={step} className="flex items-center gap-2 text-[12px]">
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-full border",
                        done && "border-success bg-success-soft text-success",
                        failed && "border-danger bg-danger-soft text-danger",
                        !done && !failed && "border-border text-muted-foreground/40",
                      )}
                    >
                      {done ? <Check className="size-2.5" /> : failed ? <CircleAlert className="size-2.5" /> : <Clock3 className="size-2.5" />}
                    </span>
                    <span className={cn(!done && !failed && "text-muted-foreground")}>{step}</span>
                  </li>
                )
              })}
            </ol>
            {survey.failureReason && (
              <p className="mt-2 rounded-md border border-danger-border bg-danger-soft px-2.5 py-2 text-[11px] text-danger">
                {survey.failureReason}
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Source files
            </p>
            <ul className="space-y-1">
              {survey.assets.map((asset) => (
                <li key={asset.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-[11.5px]">
                  <FileImage className="size-3.5 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{asset.name}</span>
                  <span className="flex shrink-0 items-center gap-1 text-[10.5px] text-muted-foreground">
                    <HardDrive className="size-3" />
                    {asset.sizeMb} MB
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Findings
            </p>
            {findings.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">
                {survey.status === "completed" ? "Analysis completed without findings." : "No findings yet."}
              </p>
            ) : (
              <ul className="space-y-1">
                {findings.map((obs) => (
                  <li key={obs.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-[12px]">{obs.category}</span>
                    <StatusBadge meta={severityMeta[obs.severity]} showIcon={false} />
                    <span className="text-[10.5px] text-muted-foreground tabular">
                      {Math.round(obs.confidence * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetBody>

        <SheetFooter>
          <span className="text-[10.5px] text-muted-foreground">{survey.imageCount} images · {survey.durationMin} min flight</span>
          <Button size="sm" className="gap-1" asChild>
            <Link to={`/fields/${field.id}`}>
              Open field <ArrowRight />
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-[12px] font-medium">{value}</p>
    </div>
  )
}

interface FrameObservation {
  category: string
  severity: "low" | "medium" | "high" | "critical"
  confidence: number
  observation: string
  interpretation: string
  recommendation: string
  areaShare: number
}

interface FrameAnalysis {
  usable: boolean
  summary: string
  limitations: string[]
  observations: FrameObservation[]
  segmentation?: {
    prompt: string
    count: number
    coverage: number
    boxes: { x1: number; y1: number; x2: number; y2: number }[]
    frame: { width: number; height: number } | null
  }[]
}

function UploadDialog({
  open,
  onOpenChange,
  initialFieldId = "",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialFieldId?: string
}) {
  const [step, setStep] = React.useState<"setup" | "processing" | "done">("setup")
  const [stage, setStage] = React.useState(0)
  const [fieldId, setFieldId] = React.useState(initialFieldId)
  const [sensor, setSensor] = React.useState("RGB")
  const [file, setFile] = React.useState<{ name: string; dataUrl: string } | null>(null)
  const [result, setResult] = React.useState<FrameAnalysis | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [activePrompt, setActivePrompt] = React.useState<string | null>(null)
  const [savedSurveyId, setSavedSurveyId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setStep("setup")
      setStage(0)
      setFile(null)
      setFieldId(initialFieldId)
      setSensor("RGB")
      setResult(null)
      setError(null)
      setActivePrompt(null)
      setSavedSurveyId(null)
    }
  }, [open])

  React.useEffect(() => {
    if (step !== "processing") return
    if (stage >= STEPS.length) {
      // With a real frame the animation can finish before the model does —
      // hold the processing state until the request settles.
      if (file && !result && !error) return
      const done = window.setTimeout(() => setStep("done"), 450)
      return () => window.clearTimeout(done)
    }
    const next = window.setTimeout(() => setStage((value) => value + 1), 700)
    return () => window.clearTimeout(next)
  }, [step, stage, file, result, error])

  const field = getField(fieldId)
  const farm = field ? getFarm(field.farmId) : undefined

  const pickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    const reader = new FileReader()
    reader.onload = () => {
      setFile({ name: selected.name, dataUrl: String(reader.result) })
      setError(null)
    }
    reader.readAsDataURL(selected)
  }

  const bestSegment = React.useMemo(() => {
    if (!result?.segmentation) return null
    const candidates = result.segmentation.filter((segment) => segment.count > 0 && segment.boxes.length > 0)
    if (!candidates.length) return null
    return candidates.reduce((best, current) => (current.coverage > best.coverage ? current : best))
  }, [result])

  const shownSegment =
    result?.segmentation?.find((segment) => segment.prompt === activePrompt) ?? bestSegment

  const start = () => {
    setStep("processing")
    setStage(0)
    setResult(null)
    setError(null)

    if (!file) return

    void fetch("/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldId, image: file.dataUrl, sensor, capturedAt: new Date().toISOString() }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string; error?: string } | null
          throw new Error(body?.message ?? body?.error ?? `Analysis failed (${response.status})`)
        }
        const analysis = (await response.json()) as FrameAnalysis
        setResult(analysis)

        // Persist the frame and its findings so the field history moves forward.
        if (analysis.observations.length > 0) {
          const saved = await fetch("/api/surveys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fieldId,
              sensor,
              summary: analysis.summary,
              limitations: analysis.limitations,
              observations: analysis.observations,
              model: "sam-3.1 + muse-spark-1.3",
            }),
          })
          if (saved.ok) {
            const body = (await saved.json()) as { surveyId: string }
            setSavedSurveyId(body.surveyId)
          }
        }
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Analysis failed")
      })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-[460px] overflow-y-auto">
        {step === "setup" && (
          <>
            <DialogHeader>
              <DialogTitle>Upload survey</DialogTitle>
              <DialogDescription>
                Attach a frame to a field. The vision model analyses it; processing is simulated around it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] font-medium text-muted-foreground">Field</span>
                <Select value={fieldId} onValueChange={setFieldId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {getFarm(item.farmId)?.name} · {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-medium text-muted-foreground">Sensor</span>
                  <Select value={sensor} onValueChange={setSensor}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RGB">RGB</SelectItem>
                      <SelectItem value="Multispectral">Multispectral</SelectItem>
                      <SelectItem value="Thermal">Thermal</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium text-muted-foreground">Captured</span>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="mt-1 h-8 w-full rounded-md border border-input bg-card px-2.5 text-[12.5px] outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                </label>
              </div>

              <label
                className={cn(
                  "flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center transition-colors",
                  file ? "border-primary/40 bg-accent/40" : "border-[#d5dfd7] bg-[#fbfcfb] hover:border-[#c3d2c7]",
                )}
              >
                <input type="file" accept="image/*" className="sr-only" onChange={pickFile} />
                <Upload className="size-4 text-muted-foreground" />
                <span className="text-[12px] font-medium">
                  {file ? file.name : "Choose a survey frame"}
                </span>
                <span className="text-[10.5px] text-muted-foreground">
                  {file ? "Attached · analysed by the vision model" : "JPG or PNG · one frame is enough for the demo"}
                </span>
              </label>

              {fieldId && !field?.cropCycleId && (
                <p className="rounded-md border border-warning-border bg-warning-soft px-2.5 py-2 text-[11px] text-warning">
                  This field has no active crop cycle. Analysis will be limited to land cover.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <span className="text-[10.5px] text-muted-foreground">
                {file ? "Analysed by Meta's vision model." : "No frame: the run is simulated."}
              </span>
              <Button disabled={!fieldId} onClick={start} className="gap-1.5">
                {file ? "Analyze frame" : "Start demo upload"} <ArrowRight />
              </Button>
            </div>
          </>
        )}

        {step === "processing" && (
          <>
            <DialogHeader>
              <DialogTitle>{file ? "Analyzing frame" : "Processing survey"}</DialogTitle>
              <DialogDescription>
                {farm ? `${farm.name} · ${field?.name}` : "Uploading"} · {sensor}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Progress value={(stage / STEPS.length) * 100} />
              <ol className="space-y-1.5">
                {STEPS.map((label, index) => {
                  const done = index < stage
                  const active = index === stage
                  return (
                    <li key={label} className="flex items-center gap-2 text-[12px]">
                      <span
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded-full border",
                          done && "border-success bg-success-soft text-success",
                          active && "border-info bg-info-soft text-info",
                          !done && !active && "border-border text-muted-foreground/40",
                        )}
                      >
                        {done ? <Check className="size-2.5" /> : active ? <Loader2 className="size-2.5 animate-spin" /> : <Clock3 className="size-2.5" />}
                      </span>
                      <span className={cn(!done && !active && "text-muted-foreground")}>{label}</span>
                    </li>
                  )
                })}
              </ol>
              {stage >= STEPS.length && file && !result && !error && (
                <p className="text-[11px] text-muted-foreground">Waiting for the model to finish…</p>
              )}
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle>{error ? "Analysis unavailable" : "Analysis complete"}</DialogTitle>
              <DialogDescription>
                {field?.name} · {sensor} survey
              </DialogDescription>
            </DialogHeader>

            {error ? (
              <div className="rounded-lg border border-warning-border bg-warning-soft px-3 py-2.5 text-[11.5px] text-warning">
                {error}
                <p className="mt-1 text-[10.5px] opacity-80">
                  Check META_API_KEY / META_BASE_URL on the server, then retry.
                </p>
              </div>
            ) : result ? (
              <div className="space-y-2.5">
                {shownSegment && file && shownSegment.frame && (
                  <div className="space-y-1.5">
                    <div className="relative overflow-hidden rounded-md border border-border bg-[#1b241f]">
                      <img src={file.dataUrl} alt="Analysed frame" className="block w-full" />
                      <svg
                        viewBox={`0 0 ${shownSegment.frame.width} ${shownSegment.frame.height}`}
                        className="absolute inset-0 h-full w-full"
                        preserveAspectRatio="none"
                      >
                        {shownSegment.boxes.map((box, index) => (
                          <rect
                            key={index}
                            x={box.x1}
                            y={box.y1}
                            width={box.x2 - box.x1}
                            height={box.y2 - box.y1}
                            fill="none"
                            stroke="#FFD166"
                            strokeWidth={2}
                            vectorEffect="non-scaling-stroke"
                          />
                        ))}
                      </svg>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                      <span className="rounded-[4px] bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">SAM 3.1</span>
                      {(result.segmentation ?? [])
                        .filter((segment) => segment.count > 0)
                        .map((segment) => (
                          <button
                            key={segment.prompt}
                            onClick={() => setActivePrompt(segment.prompt)}
                            className={cn(
                              "rounded-[4px] border px-1.5 py-0.5 transition-colors",
                              shownSegment.prompt === segment.prompt
                                ? "border-primary/40 bg-accent text-accent-foreground"
                                : "border-border text-muted-foreground hover:bg-muted",
                            )}
                          >
                            {segment.prompt} · {segment.count} · {segment.coverage}%
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <p className="text-[12px] leading-relaxed">{result.summary}</p>
                {result.observations.map((obs, index) => (
                  <div key={index} className="rounded-md border border-border px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium">{obs.category}</span>
                      <StatusBadge meta={severityMeta[obs.severity]} showIcon={false} />
                      <span className="ml-auto text-[10.5px] text-muted-foreground tabular">
                        {Math.round(obs.confidence * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">{obs.observation}</p>
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground/80">
                      Suspected: {obs.interpretation} · {obs.areaShare}% of frame
                    </p>
                  </div>
                ))}
                {result.limitations.length > 0 && (
                  <p className="text-[10.5px] text-muted-foreground">Limits: {result.limitations.join(" ")}</p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[22px] font-semibold tabular">2</span>
                  <span className="text-[12px] text-muted-foreground">simulated observations</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  No frame attached, so nothing was analysed. Attach a photo to run the model.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <span className="text-[10.5px] text-muted-foreground">
                {savedSurveyId
                  ? "Saved to the field history."
                  : result
                    ? "SAM 3.1 + Muse Spark on Meta Model API."
                    : "Nothing saved."}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  disabled={!field}
                  onClick={() => {
                    if (!field) return
                    // Full navigation so the field reloads from /api/bootstrap.
                    window.location.assign(`/fields/${field.id}`)
                  }}
                >
                  Open field <ArrowRight />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
