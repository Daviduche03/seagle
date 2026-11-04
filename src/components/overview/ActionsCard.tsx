import { Link } from "react-router-dom"
import { ArrowRight, Clock3, Flag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RecordRow, RowRight } from "./RecordRow"
import { formatShortDate } from "@/lib/format"
import { getField, getMember } from "@/data/store"
import type { FarmAction } from "@/data/types"

const priorityTone = { high: "warning", medium: "default", low: "default" } as const

export function ActionsCard({
  tasks,
  openCount,
  overdueCount,
}: {
  tasks: FarmAction[]
  openCount: number
  overdueCount: number
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Outstanding actions</CardTitle>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            {openCount} open · {overdueCount} overdue
          </p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" asChild>
          <Link to="/actions">
            Board <ArrowRight />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="px-0">
        {tasks.length === 0 ? (
          <p className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">
            No open tasks. Everything is verified.
          </p>
        ) : (
          tasks.map((task) => {
            const field = getField(task.fieldId)!
            const assignee = getMember(task.assigneeId)
            const overdue = new Date(task.dueDate).getTime() < Date.now()
            const inProgress = task.status === "in_progress"

            return (
              <RecordRow
                key={task.id}
                icon={inProgress ? Clock3 : Flag}
                tone={inProgress ? "info" : "neutral"}
                title={task.title}
                meta={`${field.name} · ${assignee?.name ?? "Unassigned"}`}
                right={
                  <RowRight
                    primary={task.priority === "high" ? "High" : task.priority === "medium" ? "Medium" : "Low"}
                    tone={priorityTone[task.priority]}
                    secondary={formatShortDate(task.dueDate)}
                    secondaryTone={overdue ? "danger" : "default"}
                  />
                }
              />
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
