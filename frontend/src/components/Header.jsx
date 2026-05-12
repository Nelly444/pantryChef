import { Leaf } from './Icons.jsx'

export default function Header({ onNavigate }) {
  return (
    <header className="sticky top-0 z-[150] border-b border-olive/30 bg-bark shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

        <a href="#top" className="flex items-center gap-3 no-underline group">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest/60 ring-2 ring-olive/40 text-olive-light transition group-hover:bg-forest/80">
            <Leaf size={18} />
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold italic tracking-wide text-cream sm:text-xl">
              PantryChef
            </span>
            <span className="mt-0.5 text-[11px] font-medium tracking-wider text-olive uppercase hidden sm:block">
              Your pantry. Every meal.
            </span>
          </div>
        </a>

        <nav className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNavigate?.('cook')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-olive-light transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive active:opacity-70"
          >
            My Pantry
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('result')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-olive transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive active:opacity-70"
          >
            Recipe
          </button>
        </nav>

      </div>
    </header>
  )
}
