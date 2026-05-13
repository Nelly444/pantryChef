import { Leaf, Bowl, Zap, Flame } from './Icons.jsx'

const CARDS = [
  { key: 'ingredients', Icon: Leaf,  label: 'Ingredients',   accent: 'border-l-forest' },
  { key: 'recipes',     Icon: Bowl,  label: 'Recipes Found',  accent: 'border-l-sage' },
  { key: 'match',       Icon: Zap,   label: 'Best Match',     accent: 'border-l-harvest' },
  { key: 'calories',    Icon: Flame, label: 'Avg. Calories',  accent: 'border-l-rust' },
]

export default function StatCards({ ingredientCount, recipeCount, bestMatch, avgCalories }) {
  const values = {
    ingredients: ingredientCount || 0,
    recipes:     recipeCount     || 0,
    match:       bestMatch   ? `${Math.round(bestMatch)}%` : '—',
    calories:    avgCalories ? Math.round(avgCalories)     : '—',
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map(({ key, Icon, label, accent }) => (
        <div
          key={key}
          className={`stat-card cursor-default rounded-2xl border border-olive/20 border-l-4 ${accent} bg-white p-4 shadow-sm`}
        >
          <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-forest/10 text-forest transition-transform duration-200 group-hover:scale-110">
            <Icon size={15} />
          </div>
          <p className="text-2xl font-black text-bark">{values[key]}</p>
          <p className="mt-0.5 text-xs font-medium text-bark-light/55">{label}</p>
        </div>
      ))}
    </div>
  )
}
