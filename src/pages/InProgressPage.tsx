import { Link } from "react-router-dom"
import { ArrowLeft, Hammer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader, EmptyState } from "@/components/layout/PageHeader"

export function InProgressPage() {
  return (
    <>
      <PageHeader
        title="In progress"
        subtitle="This screen is not part of the first build slice."
      />
      <EmptyState
        icon={<Hammer className="size-5" />}
        title="Not built yet"
        description="The first slice covers Overview, Farms & Fields, Field Detail and Drone Intelligence. This route is a placeholder so navigation never dead-ends."
        action={
          <Button variant="secondary" size="sm" asChild>
            <Link to="/">
              <ArrowLeft /> Back to overview
            </Link>
          </Button>
        }
      />
    </>
  )
}
