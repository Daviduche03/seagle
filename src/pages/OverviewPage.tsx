import * as React from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { KpiStrip } from "@/components/overview/KpiStrip"
import { AttentionCard } from "@/components/overview/AttentionCard"
import { FarmActivityCard } from "@/components/overview/FarmActivityCard"
import { FindingDrawer } from "@/components/intelligence/FindingDrawer"
import { AreaChart } from "@/components/dither-kit/area-chart"
import { Area as DitherArea } from "@/components/dither-kit/area"
import { XAxis } from "@/components/dither-kit/x-axis"
import { YAxis } from "@/components/dither-kit/y-axis"
import { Tooltip } from "@/components/dither-kit/tooltip"
import type { Observation } from "@/data/types"
import {
  cropDistribution,
  escalatedObservations,
  farms,
  findingsByWeek,
  findingsSummary,
  organizationKpis,
  recentSurveys,
} from "@/data/store"

export function OverviewPage() {
  const [selected, setSelected] = React.useState<Observation | null>(null)

  const kpis = organizationKpis()
  const summary = findingsSummary()
  const attention = escalatedObservations()
  const activity = recentSurveys(6)
  const findings = findingsByWeek(9).map((point) => ({ label: point.label, findings: point.value }))

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`${summary.open} open findings across ${farms.length} farms — ${summary.escalated} need a decision`}
      />

      <KpiStrip kpis={kpis} farms={farms} crops={cropDistribution()} />

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[1.15fr_1fr]">
        <AttentionCard items={attention.slice(0, 6)} total={attention.length} onSelect={setSelected} />
        <FarmActivityCard
          surveys={activity}
          processingCount={activity.filter((s) => s.status !== "completed" && s.status !== "failed").length}
        />
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex items-end justify-between gap-3 px-4 pt-3.5 pb-1">
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.085em] text-[#74817a] uppercase">
              Findings detected
            </p>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[22px] leading-none font-semibold tracking-[-0.02em] tabular">
                {findings.reduce((sum, point) => sum + point.findings, 0)}
              </span>
              <span className="text-[11px] text-muted-foreground">in the last 9 weeks</span>
            </p>
          </div>
          <span className="pb-0.5 text-[11px] text-muted-foreground tabular">{summary.resolved} resolved</span>
        </div>
        <CardContent className="pt-1">
          <AreaChart
            data={findings}
            config={{ findings: { label: "Findings", color: "green" } }}
            bloom="aura"
            animate={false}
            className="h-[230px] w-full"
          >
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip labelKey="label" />
            <DitherArea dataKey="findings" variant="gradient" />
          </AreaChart>
        </CardContent>
      </Card>

      <FindingDrawer observation={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  )
}
