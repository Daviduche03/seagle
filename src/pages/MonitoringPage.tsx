import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { AreaChart } from "@/components/dither-kit/area-chart"
import { Area as DitherArea } from "@/components/dither-kit/area"
import { BarChart } from "@/components/dither-kit/bar-chart"
import { Bar } from "@/components/dither-kit/bar"
import { PieChart } from "@/components/dither-kit/pie-chart"
import { Pie } from "@/components/dither-kit/pie"
import { XAxis } from "@/components/dither-kit/x-axis"
import { YAxis } from "@/components/dither-kit/y-axis"
import { Tooltip } from "@/components/dither-kit/tooltip"
import { Legend } from "@/components/dither-kit/legend"
import {
  cropDistribution,
  farms,
  findingsByWeek,
  findingsSummary,
  observations,
  surveysByWeek,
} from "@/data/store"

const CROP_COLORS = ["green", "orange", "purple", "blue", "pink", "red"] as const

export function MonitoringPage() {
  const summary = findingsSummary()
  const crops = cropDistribution()
  const findings = findingsByWeek(9).map((point) => ({ label: point.label, findings: point.value }))
  const surveys = surveysByWeek(9).map((point) => ({ label: point.label, surveys: point.value }))

  const byFarm = farms.map((farm) => {
    const open = observations.filter((o) => o.farmId === farm.id && o.status !== "resolved")
    return {
      farm: farm.name.replace(" Farm", ""),
      critical: open.filter((o) => o.severity === "critical").length,
      high: open.filter((o) => o.severity === "high").length,
      medium: open.filter((o) => o.severity === "medium").length,
      low: open.filter((o) => o.severity === "low").length,
    }
  })

  const cropConfig = Object.fromEntries(
    crops.map((crop, index) => [crop.crop, { label: crop.crop, color: CROP_COLORS[index % CROP_COLORS.length] }]),
  )

  return (
    <>
      <PageHeader
        title="Health & Monitoring"
        subtitle={`${summary.open} open · ${summary.escalated} high or critical · ${summary.resolved} resolved across the organization`}
      />

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <ChartCard title="Findings detected" hint="Observations from analyzed surveys · last 9 weeks">
          <AreaChart
            data={findings}
            config={{ findings: { label: "Findings", color: "green" } }}
            bloom="aura"
            animate={false}
            className="h-[248px] w-full"
          >
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip labelKey="label" />
            <DitherArea dataKey="findings" variant="gradient" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Crop mix" hint={`${crops.reduce((sum, crop) => sum + crop.ha, 0)} ha cultivated`}>
          <PieChart
            data={crops}
            config={cropConfig}
            dataKey="ha"
            nameKey="crop"
            innerRadius={0.58}
            bloom="aura"
            animate={false}
            className="h-[248px] w-full"
          >
            <Legend align="center" />
            <Tooltip />
            <Pie variant="gradient" />
          </PieChart>
        </ChartCard>

        <ChartCard title="Findings by farm" hint="Open observations grouped by severity">
          <BarChart
            data={byFarm}
            config={{
              critical: { label: "Critical", color: "red" },
              high: { label: "High", color: "orange" },
              medium: { label: "Medium", color: "blue" },
              low: { label: "Low", color: "grey" },
            }}
            stackType="stacked"
            bloom="aura"
            animate={false}
            className="h-[248px] w-full"
          >
            <XAxis dataKey="farm" />
            <YAxis />
            <Legend isClickable />
            <Tooltip labelKey="farm" />
            <Bar dataKey="critical" variant="gradient" />
            <Bar dataKey="high" variant="gradient" />
            <Bar dataKey="medium" variant="gradient" />
            <Bar dataKey="low" variant="gradient" />
          </BarChart>
        </ChartCard>

        <ChartCard title="Surveys processed" hint="Completed drone surveys · last 9 weeks">
          <AreaChart
            data={surveys}
            config={{ surveys: { label: "Surveys", color: "blue" } }}
            bloom="aura"
            animate={false}
            className="h-[248px] w-full"
          >
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip labelKey="label" />
            <DitherArea dataKey="surveys" variant="dotted" />
          </AreaChart>
        </ChartCard>
      </div>

      <p className="mt-3 max-w-[70ch] text-[10.5px] leading-relaxed text-muted-foreground">
        All charts are counts of recorded observations and surveys — not vegetation indices. NDVI requires
        multispectral imagery, and most surveys in this workspace are RGB.
      </p>
    </>
  )
}

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="px-4 pt-3.5 pb-2">
        <p className="text-[10.5px] font-semibold tracking-[0.085em] text-[#74817a] uppercase">{title}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <CardContent className="px-4 pt-1">{children}</CardContent>
    </Card>
  )
}
