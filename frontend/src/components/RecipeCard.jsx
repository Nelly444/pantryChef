import { Clock, Flame, Users, Leaf, HeartFilled, HeartOutline, Plate } from './Icons.jsx'

export default function RecipeCard({ result, isFav, onToggleFav, onSelect }) {
  const { recipe, match_percentage, missing_ingredients = [], nutrition } = result

  const matchColor =
    match_percentage >= 80 ? 'bg-forest' :
    match_percentage >= 60 ? 'bg-harvest' : 'bg-rust'

  const matchGlow =
    match_percentage >= 80 ? 'group-hover:border-forest/40' :
    match_percentage >= 60 ? 'group-hover:border-harvest/40' : 'group-hover:border-rust/30'

  return (
    <article
      className={`card-enter group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-olive/20 bg-white shadow-sm card-interactive ${matchGlow}`}
      onClick={() => onSelect(result)}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-olive-light">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title ?? 'Recipe'}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-olive-light text-bark-light/20">
            <Plate size={48} />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Match badge */}
        <div className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-black text-white shadow-sm transition-transform duration-200 group-hover:scale-105 ${matchColor}`}>
          {Math.round(match_percentage)}% match
        </div>

        {/* Save button — passes full result so missing_ingredients are preserved */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleFav(result) }}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-forest shadow-sm transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-90"
          aria-label={isFav ? 'Remove from saved' : 'Save recipe'}
        >
          {isFav ? <HeartFilled size={14} /> : <HeartOutline size={14} />}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display mb-3 line-clamp-2 text-base font-bold italic leading-snug text-bark transition-colors duration-200 group-hover:text-forest">
          {recipe.title}
        </h3>

        {/* Metadata */}
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-bark-light/60">
          {typeof recipe.readyInMinutes === 'number' && (
            <span className="inline-flex items-center gap-1">
              <Clock size={11} /> {recipe.readyInMinutes} min
            </span>
          )}
          {nutrition?.calories > 0 && (
            <span className="inline-flex items-center gap-1">
              <Flame size={11} /> {Math.round(nutrition.calories)} cal
            </span>
          )}
          {typeof recipe.servings === 'number' && (
            <span className="inline-flex items-center gap-1">
              <Users size={11} /> {recipe.servings}
            </span>
          )}
          {recipe.vegetarian && (
            <span className="inline-flex items-center gap-1 text-sage-dark">
              <Leaf size={11} /> Veg
            </span>
          )}
        </div>

        {/* Missing ingredients */}
        {missing_ingredients.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1">
            {missing_ingredients.slice(0, 3).map(m => (
              <span
                key={m}
                className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600"
              >
                {m}
              </span>
            ))}
            {missing_ingredients.length > 3 && (
              <span className="rounded-full border border-olive/20 bg-cream px-2 py-0.5 text-[10px] font-semibold text-bark-light/60">
                +{missing_ingredients.length - 3}
              </span>
            )}
          </div>
        ) : (
          <div className="mb-3">
            <span className="rounded-full border border-sage/40 bg-sage/10 px-2 py-0.5 text-[10px] font-semibold text-sage-dark">
              All ingredients in pantry
            </span>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onSelect(result) }}
            className="btn-primary w-full rounded-xl bg-bark px-3 py-2.5 text-xs font-bold text-white"
          >
            View Recipe
          </button>
        </div>
      </div>
    </article>
  )
}
