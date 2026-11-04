import { cn } from "@/lib/utils"

/**
 * Deterministic aerial-style evidence artwork.
 *
 * The demo has no real drone imagery, so this renders a procedural field surface
 * from a stable seed instead of shipping stock photos that would imply provenance
 * the data does not have. Metadata shown next to it (sensor, altitude, capture
 * date) is what the survey record actually contains.
 */
export function EvidenceImage({
  seed,
  className,
  annotated = false,
  zoneLabel,
  variant = "aerial",
  overlayLabel,
}: {
  seed: string
  className?: string
  annotated?: boolean
  zoneLabel?: string
  variant?: "aerial" | "closeup" | "thermal"
  overlayLabel?: string
}) {
  const h = hash(seed)
  const rnd = (i: number) => fract(Math.sin(h + i * 12.9898) * 43758.5453)
  const rowAngle = -8 + rnd(1) * 16
  const rows = 22 + Math.floor(rnd(2) * 10)
  const patchCount = 2 + Math.floor(rnd(3) * 3)
  const baseHue = variant === "thermal" ? 22 : 96 + rnd(4) * 22
  const baseSat = variant === "thermal" ? 42 : 26 + rnd(5) * 16
  const baseLight = variant === "thermal" ? 34 : 30 + rnd(6) * 12
  const boundary = [
    [0.06 + rnd(7) * 0.05, 0.1 + rnd(8) * 0.05],
    [0.9 + rnd(9) * 0.05, 0.08 + rnd(10) * 0.06],
    [0.94 + rnd(11) * 0.04, 0.86 + rnd(12) * 0.06],
    [0.08 + rnd(13) * 0.06, 0.9 + rnd(14) * 0.05],
  ]

  return (
    <div className={cn("relative overflow-hidden bg-[#22301f]", className)}>
      <svg viewBox="0 0 640 420" className="h-full w-full" role="img" aria-label="Field evidence imagery (sample)">
        <defs>
          <linearGradient id={`base-${seed}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(${baseHue} ${baseSat}% ${baseLight + 8}%)`} />
            <stop offset="100%" stopColor={`hsl(${baseHue - 8} ${baseSat - 4}% ${baseLight - 6}%)`} />
          </linearGradient>
          <radialGradient id={`vig-${seed}`} cx="50%" cy="45%" r="78%">
            <stop offset="55%" stopColor="#0b140c" stopOpacity="0" />
            <stop offset="100%" stopColor="#0b140c" stopOpacity="0.42" />
          </radialGradient>
          <filter id={`grain-${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(h % 100)} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.11" />
            </feComponentTransfer>
          </filter>
          <filter id={`soft-${seed}`}>
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <rect width="640" height="420" fill={`url(#base-${seed})`} />

        {/* planting rows */}
        <g transform={`rotate(${rowAngle} 320 210)`} opacity="0.5">
          {Array.from({ length: rows }).map((_, i) => (
            <line
              key={i}
              x1={-80}
              x2={720}
              y1={30 + (i * 380) / rows}
              y2={30 + (i * 380) / rows}
              stroke={`hsl(${baseHue + 6} ${baseSat + 8}% ${baseLight - 12}%)`}
              strokeWidth={1 + rnd(20 + i) * 2}
              strokeOpacity={0.35 + rnd(40 + i) * 0.3}
            />
          ))}
        </g>

        {/* soil / crop variation patches */}
        {Array.from({ length: patchCount }).map((_, i) => {
          const cx = 70 + rnd(50 + i) * 500
          const cy = 60 + rnd(60 + i) * 300
          const rx = 30 + rnd(70 + i) * 90
          const ry = 22 + rnd(80 + i) * 60
          const tone =
            variant === "thermal"
              ? `hsl(${8 + rnd(90 + i) * 16} 62% ${46 + rnd(91 + i) * 10}%)`
              : `hsl(${44 + rnd(100 + i) * 22} ${34 + rnd(110 + i) * 20}% ${38 + rnd(120 + i) * 12}%)`
          return (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={tone}
              opacity={0.32 + rnd(130 + i) * 0.25}
              filter={`url(#soft-${seed})`}
              transform={`rotate(${rnd(140 + i) * 40 - 20} ${cx} ${cy})`}
            />
          )
        })}

        {/* field boundary */}
        <polygon
          points={boundary.map(([x, y]) => `${x * 640},${y * 420}`).join(" ")}
          fill="none"
          stroke="#f4f7f2"
          strokeOpacity="0.62"
          strokeWidth="2"
          strokeDasharray={annotated ? "0" : "7 7"}
          vectorEffect="non-scaling-stroke"
        />

        {annotated && (
          <>
            <polygon
              points={`${250},${150} ${420},${128} ${452},${252} ${268},${276}`}
              fill="#f2c14e"
              fillOpacity="0.16"
              stroke="#ffd873"
              strokeWidth="2"
              strokeDasharray="6 4"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx="352" cy="202" r="4" fill="#ffd873" />
            <circle cx="352" cy="202" r="12" fill="none" stroke="#ffd873" strokeWidth="1.5" opacity="0.6" />
            {zoneLabel && (
              <g>
                <rect x="360" y="212" width={zoneLabel.length * 6.2 + 14} height="20" rx="4" fill="#10201a" opacity="0.82" />
                <text x="367" y="226" fill="#f4f7f2" fontSize="11" fontFamily="Inter Variable, sans-serif">
                  {zoneLabel}
                </text>
              </g>
            )}
          </>
        )}

        <rect width="640" height="420" filter={`url(#grain-${seed})`} opacity="0.5" />
        <rect width="640" height="420" fill={`url(#vig-${seed})`} />
      </svg>

      {(overlayLabel || variant !== "aerial") && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-[#0b140c]/80 to-transparent px-3 pt-8 pb-2">
          <span className="text-[10.5px] font-medium tracking-[0.02em] text-white/80">{overlayLabel}</span>
          <span className="text-[10px] text-white/55">
            {variant === "thermal" ? "Thermal" : variant === "closeup" ? "Close-up" : "RGB"} · sample
          </span>
        </div>
      )}
    </div>
  )
}

function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h % 100000)
}

function fract(n: number) {
  return n - Math.floor(n)
}
