const FILTERS = [
  { id: 'all',        label: 'All Recipes' },
  { id: 'high-match', label: 'High Match 80%+' },
  { id: 'quick',      label: 'Quick · Under 30 min' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: '1-missing',  label: 'Nearly Complete' },
]

export default function FilterBar({ active, onChange, results }) {
  const counts = {
    all:        results.length,
    'high-match': results.filter(r => r.match_percentage >= 80).length,
    quick:      results.filter(r => (r.recipe.readyInMinutes ?? 999) <= 30).length,
    vegetarian: results.filter(r => r.recipe.vegetarian).length,
    '1-missing': results.filter(r => r.missing_ingredients.length <= 1).length,
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {FILTERS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
            active === id
              ? 'border-forest bg-forest text-white shadow-sm'
              : 'border-olive/30 bg-white text-bark-light/70 hover:border-forest/40 hover:text-bark'
          }`}
        >
          {label}
          {counts[id] > 0 && active !== id && (
            <span className="ml-1.5 rounded-full bg-olive/20 px-1.5 py-0.5 text-[10px] font-black">
              {counts[id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
