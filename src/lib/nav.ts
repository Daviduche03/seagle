import {
  Activity,
  LayoutDashboard,
  Map,
  Plane,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  badge?: "attention" | "actions"
  description?: string
}

export const workspaceNav: NavItem[] = [
  { id: "overview", label: "Overview", href: "/", icon: LayoutDashboard },
  { id: "farms", label: "Farms & Fields", href: "/farms", icon: Map },
  { id: "drone", label: "Drone Intelligence", href: "/drone", icon: Plane },
  { id: "monitoring", label: "Health & Monitoring", href: "/monitoring", icon: Activity },
]

export const adminNav: NavItem[] = [
  { id: "team", label: "Team", href: "/team", icon: Users },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
]
