const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const SHORT_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
})

const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
})

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return DATE_FMT.format(new Date(iso))
}

export function formatShortDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return SHORT_FMT.format(new Date(iso))
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—"
  const d = new Date(iso)
  return `${SHORT_FMT.format(d)} · ${TIME_FMT.format(d)}`
}

export function formatNumber(n: number, digits = 0) {
  return n.toLocaleString("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatArea(ha: number | null | undefined) {
  if (ha == null) return "—"
  return `${formatNumber(ha, ha < 10 ? 1 : 0)} ha`
}

export function formatBytes(mb: number) {
  return mb >= 1024 ? `${formatNumber(mb / 1024, 1)} GB` : `${formatNumber(mb, 0)} MB`
}

export function formatPercent(value: number, digits = 0) {
  return `${formatNumber(value * 100, digits)}%`
}

export function relativeTime(iso: string | null | undefined) {
  if (!iso) return "Never"
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`
  const days = Math.round(hours / 24)
  if (days === 1) return "Yesterday"
  if (days < 30) return `${days} days ago`
  const months = Math.round(days / 30)
  return months === 1 ? "1 month ago" : `${months} months ago`
}

export function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function confidenceLabel(value: number) {
  if (value >= 0.9) return "High"
  if (value >= 0.75) return "Moderate"
  if (value >= 0.6) return "Low"
  return "Very low"
}
