import { Leaf, Search, HeartFilled } from './Icons.jsx'

const NAV_ITEMS = [
  { id: 'home',    label: 'Home' },
  { id: 'pantry',  label: 'Pantry' },
  { id: 'saved',   label: 'Saved' },
]

export default function NavBar({ view, onNavigate, ingredientCount, savedCount }) {
  return (
    <header className="sticky top-0 z-[150] border-b border-olive/20 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">

        {/* Logo */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex shrink-0 items-center gap-2.5 no-underline group"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-white shadow-sm transition group-hover:bg-forest/85">
            <Leaf size={16} />
          </span>
          <span className="font-display text-lg font-bold italic text-bark hidden sm:block">
            PantryChef
          </span>
        </button>

        {/* Center nav */}
        <nav className="flex flex-1 justify-center gap-1">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
                view === id
                  ? 'bg-forest/10 text-forest'
                  : 'text-bark-light/65 hover:bg-cream hover:text-bark'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right utilities */}
        <div className="flex shrink-0 items-center gap-2">
          {ingredientCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-olive/30 bg-cream px-3 py-1 text-xs font-bold text-bark-light">
              <Leaf size={11} className="text-forest" />
              {ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''}
            </span>
          )}
          {savedCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('saved')}
              className="relative grid h-9 w-9 place-items-center rounded-lg text-bark-light/60 hover:bg-cream hover:text-forest transition"
              aria-label="Saved recipes"
            >
              <HeartFilled size={18} />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-forest text-[9px] font-black text-white">
                {savedCount}
              </span>
            </button>
          )}
          <div
            className="grid h-9 w-9 place-items-center rounded-lg bg-forest/10 text-xs font-black text-forest"
            aria-label="User"
          >
            NS
          </div>
        </div>

      </div>
    </header>
  )
}
