export default function Header({ onNavigate }) {
  return (
    <header className="sticky top-0 z-[150] border-b border-green-200 bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-2.5 font-bold tracking-tight text-green-900 no-underline">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-100 ring-1 ring-green-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-700">
              <path d="M4 10h16M7 6h10M6 14h12M9 18h6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-base sm:text-lg">PantryChef</span>
        </a>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate?.('cook')}
            className="rounded-lg px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-50 transition"
          >
            My Pantry
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('result')}
            className="rounded-lg px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-50 transition"
          >
            Result
          </button>
          <span className="hidden rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 sm:inline">
            🌿 Pantry-first
          </span>
        </div>
      </div>
    </header>
  )
}