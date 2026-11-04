import * as React from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, ArrowUpRight, Plus } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/common/status"
import { EvidenceImage } from "@/components/common/EvidenceImage"
import { FieldMap } from "@/components/maps/FieldMap"
import { FindingDrawer } from "@/components/intelligence/FindingDrawer"
import { severityMeta } from "@/lib/status"
import { fieldStatusMeta } from "@/lib/status"
import { formatArea, formatDate, relativeTime } from "@/lib/format"
import {
  getCropCycle,
  getFarm,
  getField,
  latestSurvey,
  observationsOfField,
  surveysOfField,
} from "@/data/store"
import type { Observation } from "@/data/types"

export function FieldDetailPage() {
  const { fieldId } = useParams()
  const field = getField(fieldId)
  const [selected, setSelected] = React.useState<Observation | null>(null)

  if (!field) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px] font-medium">Field not found</p>
        <p className="mt-1 text-[12.5px] text-muted-foreground">It may have been removed from this workspace.</p>
        <Button variant="secondary" className="mt-4" asChild>
          <Link to="/farms">
            <ArrowLeft /> Back to farms
          </Link>
        </Button>
      </div>
    )
  }

  const farm = getFarm(field.farmId)!
  const cycle = getCropCycle(field)
  const survey = latestSurvey(field.id)
  const observations = observationsOfField(field.id)
  const open = observations.filter((obs) => obs.status !== "resolved")

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Farms & Fields", href: "/farms" },
          { label: farm.name, href: `/farms?farm=${farm.id}` },
          { label: field.name },
        ]}
        title={
          <span className="flex items-center gap-2.5">
            {field.name}
            <StatusBadge meta={fieldStatusMeta[field.status]} />
          </span>
        }
        subtitle={`${field.code} · ${farm.name} · ${cycle ? `${cycle.crop} ${cycle.variety}` : "Fallow"} · ${formatArea(field.areaHa)}`}
        meta={
          <>
            <span className="text-[11.5px] text-muted-foreground">
              Last inspection {survey ? formatDate(survey.capturedAt) : "—"}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-[11.5px] text-muted-foreground">{surveysOfField(field.id).length} surveys</span>
          </>
        }
        actions={
          <Button className="gap-1.5" asChild>
            <Link to={`/drone?upload=1&field=${field.id}`}>
              <Plus /> New inspection
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3 xl:grid-cols-6">
        <Cell label="Crop" value={cycle?.crop ?? "Fallow"} sub={cycle?.variety} />
        <Cell label="Planted" value={cycle ? formatDate(cycle.plantingDate) : "—"} sub={cycle?.season} />
        <Cell label="Growth stage" value={cycle?.growthStage ?? "—"} />
        <Cell label="Area" value={formatArea(field.areaHa)} sub={field.soil} />
        <Cell label="Last survey" value={survey ? formatDate(survey.capturedAt) : "—"} sub={survey?.sensor} />
        <Cell label="Open findings" value={String(open.length)} sub={`${observations.length} total`} />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.35fr_1fr]">
        <Card className="flex flex-col">
          <CardHeader>
            <div>
              <CardTitle>Field map</CardTitle>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">Boundary and recorded observation zones</p>
            </div>
            <Badge tone="outline">{open.length} open</Badge>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <FieldMap
              fields={[field]}
              observations={observations}
              selectedId={field.id}
              focus={{ fieldIds: [field.id], key: 1 }}
              className="h-[420px] rounded-none border-0"
              showBasemapToggle={false}
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col self-start">
          <CardHeader>
            <div>
              <CardTitle>Findings</CardTitle>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">Detected from drone surveys</p>
            </div>
            <Badge tone="outline">{observations.length}</Badge>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
            {observations.length === 0 ? (
              <p className="px-4 py-12 text-center text-[12.5px] text-muted-foreground">
                No findings recorded for this field.
              </p>
            ) : (
              observations.map((obs) => (
                <button
                  key={obs.id}
                  onClick={() => setSelected(obs)}
                  className="flex w-full items-center gap-2.5 border-b border-border/60 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-muted/50"
                >
                  <EvidenceImage
                    seed={obs.evidenceAssetId}
                    className="size-10 shrink-0 rounded-md border border-border"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-medium">{obs.category}</span>
                      <StatusBadge meta={severityMeta[obs.severity]} showIcon={false} />
                    </span>
                    <span className="block truncate text-[10.5px] text-muted-foreground">
                      {obs.status.replace("_", " ")} · {relativeTime(obs.detectedAt)} · {Math.round(obs.confidence * 100)}%
                      confidence
                    </span>
                  </span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/40" />
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <FindingDrawer observation={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  )
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="text-[10px] font-semibold tracking-[0.09em] text-[#74817a] uppercase">{label}</p>
      <p className="mt-1.5 truncate text-[13px] font-semibold">{value}</p>
      {sub && <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{sub}</p>}
    </div>
  )
}
