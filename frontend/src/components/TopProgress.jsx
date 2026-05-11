export default function TopProgress({ active }) {
  if (!active) return null
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-green-100"
      role="progressbar"
      aria-valuetext="Loading"
    >
      <div className="h-full w-2/5 rounded-r-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)] indeterminate-bar" />
    </div>
  )
}