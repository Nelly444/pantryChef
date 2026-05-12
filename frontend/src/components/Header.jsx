export default function Header({ onNavigate }) {
  return (
    <header className="sticky top-0 z-[150] border-b border-[#8a9a6a]/30 bg-[#2c1f0e] shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

        <a href="#top" className="flex items-center gap-3 no-underline group">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#3d5c2e]/60 ring-2 ring-[#8a9a6a]/40 text-lg">
            🌿
          </span>
          <div className="flex flex-col leading-none">
            <span
              style={{fontFamily:'"Playfair Display",Georgia,serif'}}
              className="text-lg font-bold italic tracking-wide text-[#f4f0e6] sm:text-xl"
            >
              PantryChef
            </span>
            <span className="mt-0.5 text-[11px] font-medium tracking-wider text-[#8a9a6a] uppercase hidden sm:block">
              Turn your pantry into dinner
            </span>
          </div>
        </a>

        <nav className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNavigate?.('cook')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#d8e4c0] transition hover:bg-white/10"
          >
            My Pantry
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('result')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#8a9a6a] transition hover:bg-white/10"
          >
            Recipe
          </button>
        </nav>

      </div>
    </header>
  )
}
