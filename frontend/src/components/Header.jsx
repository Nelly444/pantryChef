export default function Header({ onNavigate }) {
  return (
    <header className="sticky top-0 z-[150] border-b border-emerald-950/20 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-50 shadow-lg shadow-emerald-950/20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight text-emerald-50">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/25">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="stroke-emerald-200" strokeWidth="2">
              <path d="M4 10h16M7 6h10M6 14h12M9 18h6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-base sm:text-lg">PantryChef</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <details className="relative group/d">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-medium text-emerald-100/90 outline-none ring-emerald-400/40 marker:hidden hover:bg-white/5 hover:text-white focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
              Cook
            </summary>
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-emerald-800/60 bg-emerald-950/95 py-1 shadow-xl ring-1 ring-black/20 backdrop-blur-md">
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm text-emerald-50/95 hover:bg-emerald-800/60"
                onClick={() => onNavigate?.('cook')}
              >
                Pantry & suggest
              </button>
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm text-emerald-50/95 hover:bg-emerald-800/60"
                onClick={() => onNavigate?.('result')}
              >
                Latest result
              </button>
            </div>
          </details>

          <details className="relative group/d">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-medium text-emerald-100/90 outline-none ring-emerald-400/40 marker:hidden hover:bg-white/5 hover:text-white focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
              Learn
            </summary>
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-emerald-800/60 bg-emerald-950/95 py-1 shadow-xl ring-1 ring-black/20 backdrop-blur-md">
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm text-emerald-50/95 hover:bg-emerald-800/60"
                onClick={() => onNavigate?.('matching')}
              >
                How matching works
              </button>
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm text-emerald-50/95 hover:bg-emerald-800/60"
                onClick={() => onNavigate?.('api')}
              >
                API & docs
              </button>
            </div>
          </details>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100/90 sm:inline">
            Full stack
          </span>
        </div>
      </div>
    </header>
  )
}
