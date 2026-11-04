import { Link } from "react-router-dom"
import { Camera, Layers, Thermometer } from "lucide-react"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/common/status"
import { surveyStatusMeta } from "@/lib/status"
import { formatArea, formatShortDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getFarm, getField } from "@/data/store"
import type { Sensor, Survey } from "@/data/types"

const sensorIcon: Record<Sensor, typeof Camera> = {
  RGB: Camera,
  Multispectral: Layers,
  Thermal: Thermometer,
}

export function FarmActivityCard({
  surveys,
  processingCount,
}: {
  surveys: Survey[]
  rangeLabel?: string
  processingCount: number
}) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2.5">
        <span className="text-[10.5px] font-semibold tracking-[0.085em] text-[#74817a] uppercase">
          Recent inspections
        </span>
        <span className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">{processingCount > 0 ? `${processingCount} processing` : "All processed"}</span>
          <Link to="/drone" className="text-muted-foreground transition-colors hover:text-foreground">
            All surveys
          </Link>
        </span>
      </div>

      {surveys.length === 0 ? (
        <p className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">No inspections recorded.</p>
      ) : (
        surveys.map((survey) => {
          const field = getField(survey.fieldId)!
          const farm = getFarm(survey.farmId)!
          const Icon = sensorIcon[survey.sensor]
          return (
            <Link
              key={survey.id}
              to={`/drone?survey=${survey.id}`}
              className="group flex w-full items-center gap-2.5 border-t border-border/60 px-4 py-2.5 transition-colors hover:bg-muted/40"
            >
              <Icon
                className={cn(
                  "size-3.5 shrink-0",
                  survey.status === "failed" ? "text-danger" : "text-[#93a099]",
                )}
                strokeWidth={1.7}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] leading-tight font-medium">{field.name}</span>
                <span className="mt-1 block truncate text-[10.5px] leading-tight text-muted-foreground tabular">
                  {farm.name} · {survey.sensor} · {formatArea(survey.coverageHa)}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[10.5px] leading-none text-muted-foreground tabular">
                  {formatShortDate(survey.capturedAt)}
                </span>
                <StatusBadge meta={surveyStatusMeta[survey.status]} variant="dot" className="text-[10.5px]" />
              </span>
            </Link>
          )
        })
      )}
    </Card>
  )
}
