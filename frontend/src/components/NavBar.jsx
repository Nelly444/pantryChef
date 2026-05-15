import { Leaf, HeartFilled } from './Icons.jsx'

const NAV_ITEMS = [
  { id: 'home',    label: 'Home' },
  { id: 'pantry',  label: 'Pantry' },
  { id: 'saved',   label: 'Saved' },
  { id: 'plan',    label: 'Meal Plan' },
  { id: 'grocery', label: 'Grocery' },
]

export default function NavBar({ view, onNavigate, ingredientCount, savedCount }) {
  return (
    <header className="sticky top-0 z-[150] border-b border-olive/20 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">

        {/* Logo */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="group flex shrink-0 items-center gap-2.5 no-underline"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-white shadow-sm transition-all duration-200 group-hover:bg-forest/85 group-hover:shadow-[0_0_0_4px_rgba(61,92,46,0.12)] group-hover:scale-105">
            <Leaf size={16} />
          </span>
          <span className="font-display hidden text-lg font-bold italic text-bark transition-colors group-hover:text-forest sm:block">
            PantryChef
          </span>
        </button>

        {/* Center nav */}
        <nav className="flex flex-1 justify-center gap-0.5">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`nav-item rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
                view === id
                  ? 'active bg-forest/10 text-forest'
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
            <span className="hidden items-center gap-1.5 rounded-full border border-olive/30 bg-cream px-3 py-1 text-xs font-bold text-bark-light transition-all duration-200 sm:inline-flex">
              <Leaf size={11} className="text-forest" />
              {ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''}
            </span>
          )}
          {savedCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('saved')}
              className="relative grid h-9 w-9 place-items-center rounded-lg text-bark-light/60 transition-all duration-150 hover:bg-cream hover:text-forest hover:scale-105"
              aria-label="Saved recipes"
            >
              <HeartFilled size={18} />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-forest text-[9px] font-black text-white">
                {savedCount}
              </span>
            </button>
          )}
        </div>

      </div>
    </header>
  )
}
