import { Link } from "react-router-dom"
import { ArrowRight, Camera, CheckCircle2, FileText, ScanSearch, TriangleAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RecordRow, RowRight } from "./RecordRow"
import { formatShortDate, relativeTime } from "@/lib/format"
import type { TimelineEvent } from "@/data/types"

const kindIcon = {
  analysis: ScanSearch,
  report: FileText,
  action: CheckCircle2,
  system: TriangleAlert,
  survey: Camera,
} as const

interface Group {
  id: string
  kind: TimelineEvent["kind"]
  title: string
  at: string
  details: string[]
}

/** Collapse consecutive events with the same title so the feed stays readable. */
function groupEvents(events: TimelineEvent[]): Group[] {
  const groups: Group[] = []
  for (const event of events) {
    const last = groups[groups.length - 1]
    if (last && last.title === event.title) {
      if (!last.details.includes(event.detail)) last.details.push(event.detail)
      continue
    }
    groups.push({ id: event.id, kind: event.kind, title: event.title, at: event.at, details: [event.detail] })
  }
  return groups
}

export function RecentActivityCard({ events }: { events: TimelineEvent[] }) {
  const groups = groupEvents(events)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Recent activity</CardTitle>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">Changes recorded across your farms</p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" asChild>
          <Link to="/reports">
            History <ArrowRight />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="px-0">
        {groups.map((group) => (
          <RecordRow
            key={group.id}
            icon={kindIcon[group.kind]}
            tone={group.kind === "system" ? "danger" : "neutral"}
            title={
              <span className="flex items-center gap-1.5">
                <span className="truncate">{group.title}</span>
                {group.details.length > 1 && (
                  <span className="shrink-0 rounded-[4px] bg-muted px-1 py-px text-[9.5px] font-medium text-muted-foreground tabular">
                    ×{group.details.length}
                  </span>
                )}
              </span>
            }
            titleTooltip={group.title}
            meta={group.details.join(" · ")}
            right={<RowRight primary={relativeTime(group.at)} secondary={formatShortDate(group.at)} />}
          />
        ))}
      </CardContent>
    </Card>
  )
}
