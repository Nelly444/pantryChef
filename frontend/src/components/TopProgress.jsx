export default function TopProgress({ active }) {
  if (!active) return null
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-emerald-950/25"
      role="progressbar"
      aria-valuetext="Loading"
    >
      <div className="h-full w-2/5 rounded-r-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] indeterminate-bar" />
    </div>
  )
}
