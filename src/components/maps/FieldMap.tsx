import * as React from "react"
import { Maximize2, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Field, LatLng, Observation } from "@/data/types"
import { fieldFill, fieldStatusMeta } from "@/lib/status"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Raster-tile map with an SVG field layer.
 *
 * Deliberately not MapLibre: the demo needs to render reliably everywhere, and
 * the only thing we need from a basemap is satellite imagery under our own
 * polygons. Tiles are plain <img> requests, the overlay is SVG, and the
 * projection is Web Mercator — no WebGL, no workers.
 */

const TILE = 256
const TILE_URL = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`

function project(lng: number, lat: number): [number, number] {
  const x = (lng + 180) / 360
  const s = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999)
  const y = 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)
  return [x, y]
}

export interface FieldMapProps {
  fields: Field[]
  observations?: Observation[]
  selectedId?: string | null
  onSelect?: (fieldId: string | null) => void
  onOpen?: (fieldId: string) => void
  className?: string
  focus?: { fieldIds: string[]; key: number }
  showLegend?: boolean
  compact?: boolean
  showBasemapToggle?: boolean
  showFindingLayer?: boolean
}

export function FieldMap({
  fields,
  observations = [],
  selectedId,
  onSelect,
  onOpen,
  className,
  showLegend = true,
  compact = false,
}: FieldMapProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState({ width: 0, height: 0 })
  const [zoomOffset, setZoomOffset] = React.useState(0)
  const [tiles, setTiles] = React.useState<{ key: string; src: string; left: number; top: number; size: number }[]>([])

  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const bounds = React.useMemo(() => {
    if (!fields.length) return null
    let minX = 1
    let minY = 1
    let maxX = 0
    let maxY = 0
    for (const field of fields) {
      for (const [lng, lat] of field.boundary) {
        const [x, y] = project(lng, lat)
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
    return { minX, minY, maxX, maxY }
  }, [fields])

  const view = React.useMemo(() => {
    if (!bounds || size.width === 0) return null
    const dx = Math.max(bounds.maxX - bounds.minX, 1e-6)
    const dy = Math.max(bounds.maxY - bounds.minY, 1e-6)
    const pad = compact ? 0.8 : 0.72
    const fit = Math.log2(Math.min((size.width * pad) / (dx * TILE), (size.height * pad) / (dy * TILE)))
    const zoom = Math.min(Math.max(fit + zoomOffset, 2), 18)
    const centerX = ((bounds.minX + bounds.maxX) / 2) * TILE * 2 ** zoom
    const centerY = ((bounds.minY + bounds.maxY) / 2) * TILE * 2 ** zoom
    return {
      zoom,
      worldSize: TILE * 2 ** zoom,
      originX: centerX - size.width / 2,
      originY: centerY - size.height / 2,
    }
  }, [bounds, size, zoomOffset, compact])

  const toScreen = React.useCallback(
    (lng: number, lat: number) => {
      if (!view) return [0, 0] as [number, number]
      const [x, y] = project(lng, lat)
      return [x * view.worldSize - view.originX, y * view.worldSize - view.originY] as [number, number]
    },
    [view],
  )

  // Build the tile grid for the current view.
  React.useEffect(() => {
    if (!view || size.width === 0) {
      setTiles([])
      return
    }
    const tileZoom = Math.max(2, Math.min(18, Math.round(view.zoom)))
    const scale = 2 ** (view.zoom - tileZoom)
    const tileSize = TILE * scale
    const tilesPerRow = 2 ** tileZoom

    const x0 = Math.floor(view.originX / tileSize)
    const x1 = Math.ceil((view.originX + size.width) / tileSize)
    const y0 = Math.floor(view.originY / tileSize)
    const y1 = Math.ceil((view.originY + size.height) / tileSize)

    const next: { key: string; src: string; left: number; top: number; size: number }[] = []
    for (let x = x0; x < x1; x++) {
      for (let y = y0; y < y1; y++) {
        if (y < 0 || y >= tilesPerRow) continue
        const wrapped = ((x % tilesPerRow) + tilesPerRow) % tilesPerRow
        next.push({
          key: `${tileZoom}/${x}/${y}`,
          src: TILE_URL(tileZoom, wrapped, y),
          left: x * tileSize - view.originX,
          top: y * tileSize - view.originY,
          size: tileSize,
        })
      }
    }
    setTiles(next)
  }, [view, size.width, size.height])

  if (!fields.length) {
    return <div className={cn("grid place-items-center rounded-lg border bg-[#eef2ee]", className)}>No fields</div>
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg border border-border bg-[#e7eee6]", className)}
    >
      <div ref={wrapRef} className="absolute inset-0">
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            draggable={false}
            loading="eager"
            className="absolute select-none"
            style={{ left: tile.left, top: tile.top, width: tile.size, height: tile.size }}
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden"
            }}
          />
        ))}

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="none"
        >
          {observations
            .filter((obs) => obs.zone)
            .map((obs) => {
              const points = (obs.zone as LatLng[])
                .map(([lng, lat]) => toScreen(lng, lat).map((n) => n.toFixed(1)).join(","))
                .join(" ")
              const critical = obs.severity === "critical"
              return (
                <polygon
                  key={obs.id}
                  points={points}
                  fill={critical ? "#FF6A55" : "#FFB347"}
                  fillOpacity={0.22}
                  stroke={critical ? "#FF9C8A" : "#FFD08A"}
                  strokeWidth={1.4}
                  strokeDasharray="5 4"
                />
              )
            })}

          {fields.map((field) => {
            const points = field.boundary
              .map(([lng, lat]) => toScreen(lng, lat).map((n) => n.toFixed(1)).join(","))
              .join(" ")
            const selected = field.id === selectedId
            const [cx, cy] = toScreen(field.centroid[0], field.centroid[1])
            return (
              <g
                key={field.id}
                onClick={() => onSelect?.(field.id)}
                onDoubleClick={() => onOpen?.(field.id)}
                className="cursor-pointer"
              >
                {selected && (
                  <polygon points={points} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeOpacity={0.55} />
                )}
                <polygon
                  points={points}
                  fill={fieldFill[field.status]}
                  fillOpacity={selected ? 0.32 : 0.22}
                  stroke={fieldFill[field.status]}
                  strokeWidth={selected ? 2.6 : 1.6}
                  strokeLinejoin="round"
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="#FFFFFF"
                  stroke="#10201A"
                  strokeWidth={2.6}
                  paintOrder="stroke"
                  style={{ pointerEvents: "none" }}
                >
                  {field.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {!compact && (
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-0.5 rounded-md border border-border bg-card/95 p-0.5 shadow-sm backdrop-blur">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => setZoomOffset((z) => z + 0.6)} aria-label="Zoom in">
                <Plus />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom in</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => setZoomOffset((z) => z - 0.6)} aria-label="Zoom out">
                <Minus />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom out</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => setZoomOffset(0)} aria-label="Fit fields">
                <Maximize2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Fit to fields</TooltipContent>
          </Tooltip>
        </div>
      )}

      {showLegend && (
        <div className="absolute bottom-2.5 left-2.5 rounded-md border border-border bg-card/95 px-2.5 py-2 shadow-sm backdrop-blur">
          <p className="mb-1.5 text-[9.5px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">Field status</p>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
            {(["healthy", "review", "attention", "critical"] as const).map((status) => (
              <li key={status} className="flex items-center gap-1.5 text-[10.5px] text-[#3d4a42]">
                <span className="size-2 rounded-[2px]" style={{ background: fieldFill[status] }} />
                {fieldStatusMeta[status].label}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 border-t pt-1 text-[8.5px] text-muted-foreground">Imagery © Esri, Maxar</p>
        </div>
      )}
    </div>
  )
}
