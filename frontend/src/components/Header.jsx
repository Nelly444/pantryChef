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

        {/* Nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <div className="relative group">
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm font-medium text-green-800 outline-none hover:bg-green-50 hover:text-green-900 focus-visible:ring-2 focus-visible:ring-green-400"
              onClick={() => onNavigate?.('cook')}
            >
              Pantry & Suggest
            </button>
          </div>
          <div className="relative group">
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm font-medium text-green-800 outline-none hover:bg-green-50 hover:text-green-900 focus-visible:ring-2 focus-visible:ring-green-400"
              onClick={() => onNavigate?.('result')}
            >
              My Result
            </button>
          </div>
          <div className="relative group">
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm font-medium text-green-800 outline-none hover:bg-green-50 hover:text-green-900 focus-visible:ring-2 focus-visible:ring-green-400"
              onClick={() => onNavigate?.('matching')}
            >
              How It Works
            </button>
          </div>
        </nav>

        {/* Badge */}
        <span className="hidden rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 sm:inline">
          🌿 Pantry-first
        </span>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-green-700 hover:bg-green-50"
            onClick={() => onNavigate?.('cook')}
            aria-label="Go to pantry"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 10h16M7 6h10M6 14h12M9 18h6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}