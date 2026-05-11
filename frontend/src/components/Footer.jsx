export default function Header({ onNavigate }) {
  return (
    <header className="sticky top-0 z-[150] border-b-2 border-[#d4a853]/40 bg-[#2c1f0e] shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-3 no-underline">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d4a853]/20 ring-2 ring-[#d4a853]/40 text-xl">
            🌿
          </span>
          <span style={{fontFamily:'"Playfair Display",Georgia,serif'}} className="text-lg font-bold italic tracking-wide text-[#faf7f2] sm:text-xl">
            PantryChef
          </span>
        </a>

        <nav className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNavigate?.('cook')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#d4a853] transition hover:bg-white/10"
          >
            My Pantry
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('result')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#a8c49a] transition hover:bg-white/10"
          >
            Recipe
          </button>
        </nav>
      </div>
    </header>
  )
}