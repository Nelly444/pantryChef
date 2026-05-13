import { useState } from 'react'
import { useMealPlan, DAY_SHORT } from '../hooks/useMealPlan.js'
import { Zap, X, Bowl, Flame, Clock } from './Icons.jsx'

function RecipePicker({ options, onPick, onClose }) {
  const [query, setQuery] = useState('')
  const filtered = options.filter(r =>
    !query || r.recipe.title?.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-olive/20 bg-white shadow-xl">
      <div className="border-b border-olive/15 p-2">
        <input
          autoFocus
          type="text"
          placeholder="Search recipes…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-xl border border-olive/20 px-3 py-2 text-sm outline-none focus-visible:border-forest"
        />
      </div>
      <ul className="max-h-56 overflow-y-auto">
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-bark-light/60">No recipes found. Run a search first.</li>
        )}
        {filtered.map(r => (
          <li key={r.recipe.id}>
            <button
              type="button"
              onClick={() => { onPick(r); onClose() }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-cream"
            >
              {r.recipe.image
                ? <img src={r.recipe.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-olive-light text-bark-light/30"><Bowl size={18} /></div>
              }
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-bark">{r.recipe.title}</p>
                <p className="text-xs text-bark-light/55">{Math.round(r.match_percentage)}% match</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClose}
        className="flex w-full items-center justify-center gap-1 border-t border-olive/15 py-2 text-xs font-bold text-bark-light/50 transition hover:text-bark-light"
      >
        Cancel
      </button>
    </div>
  )
}

function DayCard({ day, short, result, onAssign, onRemove, pickerOptions }) {
  const [showPicker, setShowPicker] = useState(false)

  const matchColor =
    !result ? '' :
    result.match_percentage >= 80 ? 'bg-forest' :
    result.match_percentage >= 60 ? 'bg-harvest' : 'bg-rust'

  return (
    <div className="relative flex flex-col">
      <p className="mb-2 text-center text-xs font-black uppercase tracking-widest text-bark-light/55">{short}</p>

      {result ? (
        <div className="day-card group relative overflow-hidden rounded-2xl border border-olive/20 bg-white shadow-sm">
          {result.recipe.image
            ? <img src={result.recipe.image} alt={result.recipe.title} className="h-32 w-full object-cover" />
            : <div className="flex h-32 items-center justify-center bg-olive-light text-bark-light/20"><Bowl size={32} /></div>
          }
          <div className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-black text-white ${matchColor}`}>
            {Math.round(result.match_percentage)}%
          </div>
          <button
            type="button"
            onClick={() => onRemove(day)}
            className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-bark-light opacity-0 shadow transition group-hover:opacity-100 hover:text-red-500"
            aria-label="Remove"
          >
            <X size={12} />
          </button>
          <div className="p-2.5">
            <p className="line-clamp-2 text-xs font-bold leading-snug text-bark">{result.recipe.title}</p>
            <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-bark-light/55">
              {typeof result.recipe.readyInMinutes === 'number' && (
                <span className="inline-flex items-center gap-0.5"><Clock size={9} />{result.recipe.readyInMinutes}m</span>
              )}
              {result.nutrition?.calories > 0 && (
                <span className="inline-flex items-center gap-0.5"><Flame size={9} />{Math.round(result.nutrition.calories)}</span>
              )}
              {result.missing_ingredients.length === 0 && (
                <span className="text-sage-dark font-semibold">All in pantry</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="group/add flex h-[11rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-olive/30 bg-white/60 text-bark-light/40 transition-all duration-200 hover:border-forest/50 hover:text-forest hover:bg-white hover:shadow-[0_4px_16px_rgba(61,92,46,0.1)] hover:-translate-y-0.5"
        >
          <span className="text-2xl font-thin leading-none">+</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Add meal</span>
        </button>
      )}

      {showPicker && (
        <RecipePicker
          options={pickerOptions}
          onPick={r => onAssign(day, r)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

export default function MealPlanView({ results, favs, expirations }) {
  const { plan, DAYS, DAY_SHORT, assign, remove, clear, generate, plannedCount, uniqueMissing } = useMealPlan()

  // Merge search results + saved favs (de-duped by id) for the picker
  const favResults = favs.map(f => ({
    recipe: f,
    match_percentage: f.match_percentage ?? 0,
    missing_ingredients: [],
    nutrition: null,
  }))
  const idsSeen = new Set(results.map(r => r.recipe.id))
  const pickerOptions = [...results, ...favResults.filter(f => !idsSeen.has(f.recipe.id))]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-black italic text-bark">Weekly Meal Plan</h2>
          <p className="text-sm text-bark-light/60">
            {plannedCount} of 7 days planned
            {uniqueMissing.length > 0 && ` · ${uniqueMissing.length} items to buy`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => generate(results, expirations)}
            disabled={results.length === 0}
            className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundImage: 'linear-gradient(90deg, #3d5c2e 0%, #5c7a42 50%, #3d5c2e 100%)' }}
          >
            <Zap size={14} /> Generate Smart Plan
          </button>
          {plannedCount > 0 && (
            <button
              type="button"
              onClick={clear}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Hint when no search results */}
      {pickerOptions.length === 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run a recipe search on Home first — results will appear here as options to plan with.
        </div>
      )}

      {/* 7-day grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {DAYS.map((day, i) => (
          <DayCard
            key={day}
            day={day}
            short={DAY_SHORT[i]}
            result={plan[day]}
            onAssign={assign}
            onRemove={remove}
            pickerOptions={pickerOptions}
          />
        ))}
      </div>

      {/* Weekly summary */}
      {plannedCount > 0 && (
        <div className="mt-8 grid gap-3 rounded-2xl border border-olive/20 bg-white p-5 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-2xl font-black text-bark">{plannedCount}</p>
            <p className="text-xs text-bark-light/55">Days planned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-bark">{uniqueMissing.length}</p>
            <p className="text-xs text-bark-light/55">Items to buy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-bark">
              {Object.values(plan).filter(r => r?.missing_ingredients.length === 0).length}
            </p>
            <p className="text-xs text-bark-light/55">Cook-ready meals</p>
          </div>
        </div>
      )}
    </div>
  )
}
