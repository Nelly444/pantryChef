export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-olive/20 bg-white">
      <div className="skeleton h-48 w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded-lg" />
        <div className="flex gap-2">
          <div className="skeleton h-3 w-14 rounded-full" />
          <div className="skeleton h-3 w-14 rounded-full" />
          <div className="skeleton h-3 w-10 rounded-full" />
        </div>
        <div className="flex gap-1">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-12 rounded-full" />
        </div>
        <div className="skeleton h-9 w-full rounded-xl" />
      </div>
    </div>
  )
}
