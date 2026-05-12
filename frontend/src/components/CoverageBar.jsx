// Tailwind requires full class names to be present in source (no string interpolation).
// The three levels map to complete, static class strings so the JIT compiler picks them up.
const LEVELS = {
  high:   { bar: 'bg-sage-dark',  label: 'text-sage-dark'  },
  medium: { bar: 'bg-harvest',    label: 'text-harvest'    },
  low:    { bar: 'bg-rust',       label: 'text-rust'       },
}

export default function CoverageBar({ pct }) {
  const p = Math.min(100, Math.max(0, pct ?? 0))
  const level = p >= 75 ? 'high' : p >= 40 ? 'medium' : 'low'
  const { bar, label } = LEVELS[level]

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs font-semibold mb-1 text-bark-light">
        <span>Pantry coverage</span>
        <span className={label}>{p}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-olive-light overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bar}`}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  )
}
