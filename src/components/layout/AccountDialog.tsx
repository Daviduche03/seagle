import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  UserRound,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { organization, team, getMember } from "@/data/store"

export function AccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate()
  const currentUser = getMember(team[0]?.id) ?? {
    id: "unknown",
    name: "Workspace",
    role: "Not signed in",
    email: "",
  }
  const contentRef = React.useRef<HTMLDivElement>(null)
  const activeMembers = team.filter((member) => member.status === "active").length

  const go = (path: string) => {
    onOpenChange(false)
    navigate(path)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        tabIndex={-1}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          contentRef.current?.focus()
        }}
        className="max-w-[404px] gap-0 overflow-hidden p-0 outline-none"
      >
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <Avatar name={currentUser.name} size="lg" />
          <div className="min-w-0">
            <DialogTitle className="truncate text-[15px]">{currentUser.name}</DialogTitle>
            <DialogDescription className="mt-0.5 truncate text-[12px]">
              {currentUser.role} · {currentUser.email}
            </DialogDescription>
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-y bg-muted/40 px-5 py-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px] border border-[#d3e2d8] bg-white text-[9.5px] font-semibold tracking-[0.02em] text-[#174b35]">
            RV
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium">{organization.name}</p>
            <p className="truncate text-[10.5px] text-muted-foreground">{organization.plan} workspace</p>
          </div>
        </div>

        <div className="p-1.5">
          <Row icon={UserRound} label="Profile" hint="Name, photo, contact" onClick={() => toast("Profile settings are not part of this demo")} />
          <Row icon={Users} label="Team" hint={`${activeMembers} active members`} onClick={() => go("/team")} />
          <Row icon={Settings} label="Workspace settings" hint={organization.plan} onClick={() => go("/settings")} />
          <Row icon={Bell} label="Notifications" hint="Email and in-app" onClick={() => toast("Notification preferences are not part of this demo")} />
        </div>

        <div className="border-t p-1.5">
          <Row
            icon={LogOut}
            label="Sign out"
            onClick={() => {
              onOpenChange(false)
              toast("Signed out — this is a demo workspace", { description: "Reloading returns you to the same account." })
            }}
            className="text-muted-foreground hover:text-foreground"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Row({
  icon: Icon,
  label,
  hint,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  hint?: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted",
        className,
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{label}</span>
      {hint && <span className="shrink-0 text-[11px] text-muted-foreground">{hint}</span>}
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
    </button>
  )
}
