import { Bowl, Clock, Leaf, CheckCircle } from './Icons.jsx'

export default function SidePanel({ results, ingredientsList }) {
  const readyNow = results.filter(r => (r.missing_ingredients ?? []).length === 0)
  const quickest = results.reduce((min, r) => {
    const t = r.recipe.readyInMinutes ?? Infinity
    return t < (min?.recipe.readyInMinutes ?? Infinity) ? r : min
  }, null)

  return (
    <div className="space-y-4">

      {/* Ready to cook */}
      <div className="rounded-2xl border border-olive/20 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle size={14} className="text-forest" />
          <p className="text-[10px] font-black uppercase tracking-widest text-bark-light/55">Ready to Cook</p>
        </div>
        {readyNow.length > 0 ? (
          <>
            <p className="font-display text-4xl font-black text-forest">{readyNow.length}</p>
            <p className="mt-0.5 text-xs text-bark-light/55">
              recipe{readyNow.length !== 1 ? 's' : ''} with all your ingredients
            </p>
            <ul className="mt-3 space-y-1.5">
              {readyNow.slice(0, 2).map(r => (
                <li key={r.recipe.id} className="text-xs font-semibold text-bark line-clamp-1">
                  · {r.recipe.title}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-bark-light/60">
            Add more ingredients to unlock fully matched recipes.
          </p>
        )}
      </div>

      {/* Quickest option */}
      {quickest && typeof quickest.recipe.readyInMinutes === 'number' && (
        <div className="rounded-2xl border border-olive/20 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Clock size={14} className="text-forest" />
            <p className="text-[10px] font-black uppercase tracking-widest text-bark-light/55">Quickest Option</p>
          </div>
          <p className="font-display text-sm font-bold italic leading-snug text-bark line-clamp-2">
            {quickest.recipe.title}
          </p>
          <p className="mt-1.5 text-xs text-bark-light/60">
            {quickest.recipe.readyInMinutes} minutes · {Math.round(quickest.match_percentage)}% match
          </p>
        </div>
      )}

      {/* Pantry snapshot */}
      {ingredientsList.length > 0 && (
        <div className="rounded-2xl border border-olive/20 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Leaf size={14} className="text-forest" />
            <p className="text-[10px] font-black uppercase tracking-widest text-bark-light/55">Your Pantry</p>
          </div>
          <ul className="space-y-2">
            {ingredientsList.slice(0, 6).map(ing => (
              <li key={ing} className="flex items-center gap-2 text-sm capitalize text-bark">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                {ing}
              </li>
            ))}
            {ingredientsList.length > 6 && (
              <li className="text-xs text-bark-light/50">+{ingredientsList.length - 6} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Best match callout */}
      {results.length > 0 && (
        <div className="rounded-2xl border border-forest/20 bg-forest/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Bowl size={14} className="text-forest" />
            <p className="text-[10px] font-black uppercase tracking-widest text-forest/70">Top Pick</p>
          </div>
          <p className="font-display text-sm font-bold italic leading-snug text-bark line-clamp-2">
            {results[0].recipe.title}
          </p>
          <p className="mt-1.5 text-xs text-forest font-semibold">
            {Math.round(results[0].match_percentage)}% ingredient match
          </p>
        </div>
      )}

    </div>
  )
}
