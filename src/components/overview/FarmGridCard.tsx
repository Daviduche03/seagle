import { Link } from "react-router-dom"
import { ArrowRight, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RecordRow, RowRight } from "./RecordRow"
import { formatArea, formatShortDate } from "@/lib/format"
import { fields, surveysOfFarm } from "@/data/store"
import type { Farm } from "@/data/types"

export function FarmGridCard({ farms }: { farms: Farm[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Farms</CardTitle>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">Field distribution and latest inspection</p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" asChild>
          <Link to="/farms">
            Open map <ArrowRight />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="px-0">
        {farms.map((farm) => {
          const farmFields = fields.filter((field) => field.farmId === farm.id)
          const flagged = farmFields.filter(
            (field) => field.status === "attention" || field.status === "critical",
          ).length
          const lastSurvey = surveysOfFarm(farm.id).find((survey) => survey.status === "completed")

          return (
            <RecordRow
              key={farm.id}
              icon={MapPin}
              title={farm.name}
              meta={`${farm.region} · ${farm.fieldCount} fields · ${formatArea(farm.totalAreaHa)}`}
              to={`/farms?farm=${farm.id}`}
              right={
                <RowRight
                  primary={flagged > 0 ? `${flagged} flagged` : "All clear"}
                  tone={flagged > 0 ? "warning" : "success"}
                  secondary={lastSurvey ? `Surveyed ${formatShortDate(lastSurvey.capturedAt)}` : "No survey yet"}
                />
              }
            />
          )
        })}
      </CardContent>
    </Card>
  )
}
