import { useEffect, useState } from 'react'
import { Clock, Users, Flame, Zap, Droplet, Wheat, Leaf, Sprout, Check, X, HeartFilled, HeartOutline, Plate } from './Icons.jsx'
import Accordion from './Accordion.jsx'
import CoverageBar from './CoverageBar.jsx'
import { cleanSummary, stripHtml } from '../lib/text.js'
import { isSafeUrl } from '../lib/validate.js'
import { getRecipeDetail } from '../lib/api.js'

export default function RecipeDetailModal({ result, serving, isFav, onToggleFav, onClose, onStartCooking }) {
  const { recipe: basicRecipe, match_percentage, missing_ingredients = [], nutrition: basicNutrition } = result
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getRecipeDetail(basicRecipe.id, serving)
      .then(d => { if (!cancelled) { setDetail(d); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [basicRecipe.id, serving])

  const recipe    = detail?.recipe ?? basicRecipe
  const nutrition = detail?.nutrition ?? basicNutrition

  const summaryPlain = cleanSummary(recipe?.summary ?? '')

  const cookingSteps = (() => {
    const analyzed = recipe.analyzedInstructions?.[0]?.steps?.map(s => s.step).filter(Boolean) ?? []
    if (analyzed.length > 0) return analyzed
    const raw = stripHtml(recipe.summary || '')
    return raw.match(/[^.!?]+[.!?]+(\s|$)/g)?.map(s => s.trim()).filter(Boolean).slice(0, 12) ?? []
  })()

  // Trap focus / close on ESC
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const matchColor =
    match_percentage >= 80 ? 'bg-forest' :
    match_percentage >= 60 ? 'bg-harvest' : 'bg-rust'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={recipe.title ?? 'Recipe detail'}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bark/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">

        {/* Header image */}
        <div className="relative shrink-0">
          {recipe.image && isSafeUrl(recipe.image) ? (
            <img
              src={recipe.image}
              alt={recipe.title ?? 'Recipe'}
              className="h-56 w-full object-cover"
            />
          ) : (
            <div className="flex h-56 items-center justify-center bg-olive-light text-bark-light/20">
              <Plate size={64} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bark/70 to-transparent" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-bark shadow transition hover:bg-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Match badge */}
          <div className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-black text-white shadow ${matchColor}`}>
            {Math.round(match_percentage)}% match
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-end gap-3">
              <h2 className="font-display flex-1 text-2xl font-black italic leading-tight text-white">
                {recipe.title}
              </h2>
              <button
                type="button"
                onClick={() => onToggleFav(result)}
                className="shrink-0 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                aria-label={isFav ? 'Remove from saved' : 'Save recipe'}
              >
                {isFav ? <HeartFilled size={18} /> : <HeartOutline size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Metadata row */}
          <div className="flex flex-wrap gap-2 border-b border-olive/15 px-5 py-4">
            {typeof recipe.readyInMinutes === 'number' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-olive/30 bg-cream px-3 py-1 text-xs font-bold text-bark-light">
                <Clock size={12} /> {recipe.readyInMinutes} min
              </span>
            )}
            {typeof recipe.servings === 'number' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-olive/30 bg-cream px-3 py-1 text-xs font-bold text-bark-light">
                <Users size={12} /> Serves {recipe.servings}
              </span>
            )}
            {recipe.vegetarian && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1 text-xs font-bold text-sage-dark">
                <Leaf size={12} /> Vegetarian
              </span>
            )}
            {recipe.vegan && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1 text-xs font-bold text-sage-dark">
                <Sprout size={12} /> Vegan
              </span>
            )}
          </div>

          <div className="space-y-4 p-5">

            {/* Coverage */}
            <CoverageBar pct={match_percentage} />

            {/* Nutrition */}
            {nutrition && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  [<Flame size={14} />, 'Cal',    Math.round(nutrition.calories ?? 0), ''],
                  [<Zap size={14} />,   'Protein', Math.round(nutrition.protein  ?? 0), 'g'],
                  [<Droplet size={14} />, 'Fat',   Math.round(nutrition.fat      ?? 0), 'g'],
                  [<Wheat size={14} />, 'Carbs',   Math.round(nutrition.carbs    ?? 0), 'g'],
                ].map(([icon, label, val, unit]) => (
                  <div key={label} className="rounded-xl border border-olive/20 bg-cream px-2 py-2.5 text-center">
                    <p className="mb-0.5 flex justify-center text-bark-light/50">{icon}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-bark-light/55">{label}</p>
                    <p className="font-black text-bark">{val}{unit}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Missing */}
            <Accordion title="Missing ingredients" defaultOpen>
              {missing_ingredients.length > 0 ? (
                <ul className="space-y-2">
                  {missing_ingredients.map(m => (
                    <li key={m} className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-rust" />
                      {m}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 font-semibold text-sage-dark">
                  <Check size={16} /> You have everything for this recipe.
                </p>
              )}
            </Accordion>

            {/* Full ingredient list */}
            <Accordion title="Full ingredient list">
              {loading ? (
                <p className="text-sm text-bark-light/60">Loading ingredients…</p>
              ) : Array.isArray(recipe.extendedIngredients) && recipe.extendedIngredients.length > 0 ? (
                <ul className="space-y-2">
                  {recipe.extendedIngredients.map(ing => (
                    <li key={ing.id ?? ing.original} className="flex items-start gap-2 border-b border-olive/15 py-2 last:border-0 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                      {ing.original || ing.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-bark-light/60">Ingredient list unavailable.</p>
              )}
            </Accordion>

            {/* Summary */}
            {summaryPlain && (
              <Accordion title="About this recipe">
                <p className="text-sm leading-relaxed text-bark-light">{summaryPlain.slice(0, 400)}{summaryPlain.length > 400 ? '…' : ''}</p>
              </Accordion>
            )}

          </div>
        </div>

        {/* Footer actions */}
        <div className="flex shrink-0 gap-3 border-t border-olive/15 bg-white px-5 py-4">
          {cookingSteps.length > 0 && (
            <button
              type="button"
              onClick={() => { onClose(); onStartCooking(cookingSteps) }}
              className="flex-1 rounded-xl bg-forest py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
            >
              Start Cooking
            </button>
          )}
          {isSafeUrl(recipe.sourceUrl) && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex-1 rounded-xl border-2 border-olive/30 bg-cream py-3 text-center text-sm font-bold text-bark-light transition hover:bg-cream-dark"
            >
              View Source ↗
            </a>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border-2 border-olive/30 bg-cream px-4 py-3 text-sm font-bold text-bark-light transition hover:bg-cream-dark"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
