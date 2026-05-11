export default function TopProgress({ active }) {
  if (!active) return null
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-[#2c1f0e]/20"
      role="progressbar"
      aria-valuetext="Loading"
    >
      <div className="h-full w-2/5 rounded-r-full bg-[#c4622d] shadow-[0_0_10px_rgba(196,98,45,0.7)] indeterminate-bar" />
    </div>
  )
}