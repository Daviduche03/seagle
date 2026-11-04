import * as React from "react"
import { Link } from "react-router-dom"
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ClipboardCheck,
  Crosshair,
  FileImage,
  HardDrive,
  MapPin,
  MessageSquarePlus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/common/status"
import { EvidenceImage } from "@/components/common/EvidenceImage"
import { ConfidenceMeter } from "@/components/common/charts"
import { severityMeta, observationStatusMeta } from "@/lib/status"
import { formatDate, formatDateTime, relativeTime } from "@/lib/format"
import type { Observation } from "@/data/types"
import { getCropCycle, getFarm, getField, getMember, getSurvey, getObservation } from "@/data/store"
import { setReview, useReview } from "@/data/live"
import { cn } from "@/lib/utils"

export function FindingDrawer({
  observation,
  onOpenChange,
}: {
  observation: Observation | null
  onOpenChange: (open: boolean) => void
}) {
  const open = Boolean(observation)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent width="520px" className="gap-0">
        {observation && <FindingDetail observation={observation} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

function FindingDetail({ observation, onClose }: { observation: Observation; onClose: () => void }) {
  const field = getField(observation.fieldId)!
  const farm = getFarm(field.farmId)!
  const survey = getSurvey(observation.surveyId)
  const asset = survey?.assets.find((a) => a.id === observation.evidenceAssetId) ?? survey?.assets[0]
  const crop = getCropCycle(field)
  const reviewer = getMember(observation.reviewedBy)
  const status = useReview(observation.id, observation.status)
  const meta = observationStatusMeta[status]
  const previous = getObservation(observation.previousObservationId)
  const [note, setNote] = React.useState("")
  const [noteOpen, setNoteOpen] = React.useState(false)

  const review = (next: "under_review" | "resolved" | "unverified", message: string) => {
    setReview(observation.id, next, note || observation.reviewNote)
    toast.success(message, {
      description: "Saved for this session. Reloading restores the demo dataset.",
    })
  }

  return (
    <>
      <SheetHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge meta={meta} />
          <StatusBadge meta={severityMeta[observation.severity]} />
          <Badge tone="outline">{observation.category}</Badge>
        </div>
        <SheetTitle className="text-[17px] leading-snug">{observation.category}</SheetTitle>
        <p className="text-[12px] text-muted-foreground">
          <Link to={`/fields/${field.id}`} className="font-medium text-foreground hover:underline">
            {field.name}
          </Link>{" "}
          · {farm.name} · detected {relativeTime(observation.detectedAt)}
        </p>
      </SheetHeader>

      <SheetBody className="space-y-5 px-5 py-4">
        <div className="overflow-hidden rounded-lg border border-border">
          <EvidenceImage
            seed={observation.evidenceAssetId}
            annotated
            zoneLabel={observation.areaHa ? `${observation.areaHa.toFixed(2)} ha flagged` : "No mapped zone"}
            className="aspect-[16/10] w-full"
            overlayLabel={asset?.name}
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-muted/50 px-3 py-2 text-[10.5px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileImage className="size-3" /> {asset?.name}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="size-3" /> {asset?.sizeMb} MB
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3" /> {formatDateTime(survey?.capturedAt)}
            </span>
            <span className="ml-auto">{survey?.sensor} · {survey?.altitudeM} m AGL</span>
          </div>
        </div>

        <div>
          <SectionLabel icon={<Crosshair className="size-3.5" />}>Observed in imagery</SectionLabel>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground">{observation.observation}</p>
          <p className="mt-1 text-[10.5px] text-muted-foreground">
            Directly visible evidence. This is what the model measured, not a diagnosis.
          </p>
        </div>

        <div className="rounded-md border border-info-border bg-info-soft/70 px-3 py-2.5">
          <SectionLabel icon={<Sparkles className="size-3.5" />} className="text-info">
            AI interpretation — suspected
          </SectionLabel>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#1b3f59]">{observation.interpretation}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10.5px] text-[#3a5f79]">Confidence</span>
            <ConfidenceMeter value={observation.confidence} className="[&_span]:text-[#1b3f59]" />
          </div>
        </div>

        <div>
          <SectionLabel icon={<ClipboardCheck className="size-3.5" />}>Recommended verification</SectionLabel>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground">{observation.recommendation}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
          <Field label="Field" value={`${field.name} · ${field.code}`} />
          <Field label="Crop" value={crop ? `${crop.crop} · ${crop.variety}` : "No active cycle"} />
          <Field label="Detected" value={formatDate(observation.detectedAt)} sub={relativeTime(observation.detectedAt)} />
          <Field label="Flagged area" value={observation.areaHa ? `${observation.areaHa.toFixed(2)} ha` : "Not mapped"} />
          <Field label="Survey" value={survey?.name ?? "—"} sub={survey ? formatDate(survey.capturedAt) : undefined} />
          <Field label="Sensor" value={survey?.sensor ?? "—"} sub={survey?.hasGeo ? "Georeferenced" : "No GPS mapping"} />
          <Field label="Pipeline" value={observation.model} sub={observation.modelRunAt ? relativeTime(observation.modelRunAt) : undefined} />
          <Field
            label="Reviewer"
            value={reviewer?.name ?? "Not reviewed"}
            sub={observation.reviewNote ?? undefined}
          />
        </dl>

        {previous && (
          <div className="rounded-md border border-border px-3 py-2.5">
            <SectionLabel>Previously recorded</SectionLabel>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {previous.category} · first detected {formatDate(previous.detectedAt)} ·{" "}
              <Link to={`/fields/${previous.fieldId}?tab=findings&finding=${previous.id}`} className="text-primary hover:underline">
                open earlier finding
              </Link>
            </p>
          </div>
        )}

        {noteOpen && (
          <div className="space-y-2">
            <label htmlFor="review-note" className="text-[11px] font-medium text-muted-foreground">
              Review note
            </label>
            <textarea
              id="review-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What did the field check show?"
              className="w-full rounded-md border border-input bg-card px-2.5 py-2 text-[12.5px] outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
        )}
      </SheetBody>

      <SheetFooter className="flex-wrap bg-card">
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => review("resolved", "Finding confirmed and resolved")}
            className="gap-1.5"
          >
            <Check /> Confirm
          </Button>
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => review("unverified", "Marked as uncertain")}>
            <RotateCcw /> Uncertain
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-danger hover:bg-danger-soft" onClick={() => review("under_review", "Finding rejected")}>
            <X /> Reject
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setNoteOpen((v) => !v)}>
            <MessageSquarePlus /> Note
          </Button>
          <Button variant="secondary" size="sm" className="gap-1.5" asChild>
            <Link to={`/fields/${field.id}?tab=map&finding=${observation.id}`} onClick={onClose}>
              <MapPin /> View on map
            </Link>
          </Button>
        </div>
      </SheetFooter>
    </>
  )
}

function SectionLabel({
  children,
  icon,
  className,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn("flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.07em] uppercase text-muted-foreground", className)}>
      {icon}
      {children}
    </p>
  )
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-[12px] font-medium" title={value}>
        {value}
      </dd>
      {sub && <dd className="truncate text-[10.5px] text-muted-foreground">{sub}</dd>}
    </div>
  )
}

export function FindingRow({
  observation,
  onOpen,
  compact = false,
}: {
  observation: Observation
  onOpen: () => void
  compact?: boolean
}) {
  const field = getField(observation.fieldId)!
  const farm = getFarm(field.farmId)!
  const survey = getSurvey(observation.surveyId)
  const status = useReview(observation.id, observation.status)

  return (
    <button
      onClick={onOpen}
      className="group flex w-full items-center gap-3 border-b border-border/70 px-1 py-2 text-left transition-colors last:border-0 hover:bg-muted/60"
    >
      <EvidenceImage
        seed={observation.evidenceAssetId}
        className={cn("shrink-0 rounded-[4px] border border-border", compact ? "size-9" : "h-11 w-14")}
        variant={survey?.sensor === "Thermal" ? "thermal" : "aerial"}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[12.5px] font-medium">{observation.category}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground tabular">{Math.round(observation.confidence * 100)}%</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="truncate">{field.name}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="truncate">{farm.name}</span>
          <span className="hidden text-muted-foreground/40 sm:inline">·</span>
          <span className="hidden shrink-0 sm:inline">{formatDate(observation.detectedAt)}</span>
        </span>
      </span>
      <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <StatusBadge meta={severityMeta[observation.severity]} showIcon={false} />
        <StatusBadge meta={observationStatusMeta[status]} showIcon={false} />
      </span>
      <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
    </button>
  )
}
