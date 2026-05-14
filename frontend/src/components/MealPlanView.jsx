import { useState } from 'react'
import { useMealPlan, DAY_SHORT } from '../hooks/useMealPlan.js'
import { Zap, X, Bowl, Flame, Clock } from './Icons.jsx'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWeekDates() {
  const today = new Date()
  const dow = today.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function fmtDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isToday(d) {
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

// ── Recipe picker ─────────────────────────────────────────────────────────────

function RecipePicker({ options, onPick, onClose }) {
  const [query, setQuery] = useState('')
  const filtered = options.filter(r =>
    !query || r.recipe.title?.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <div className="absolute left-0 z-40 mt-1 w-64 overflow-hidden rounded-2xl border border-olive/20 bg-white shadow-xl"
      style={{ top: '100%' }}>
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
      <ul className="max-h-52 overflow-y-auto">
        {filtered.length === 0 && (
          <li className="px-4 py-5 text-center text-sm text-bark-light/60">No recipes found.</li>
        )}
        {filtered.map(r => (
          <li key={r.recipe.id}>
            <button
              type="button"
              onClick={() => { onPick(r); onClose() }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-cream"
            >
              {r.recipe.image
                ? <img src={r.recipe.image} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-olive-light text-bark-light/30"><Bowl size={16} /></div>
              }
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-bark">{r.recipe.title}</p>
                <p className="text-[10px] text-bark-light/55">{Math.round(r.match_percentage)}% match</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClose}
        className="flex w-full items-center justify-center border-t border-olive/15 py-2 text-xs font-bold text-bark-light/50 transition hover:text-bark-light">
        Cancel
      </button>
    </div>
  )
}

// ── Single meal slot cell ─────────────────────────────────────────────────────

function MealCell({ day, mealType, result, onAssign, onRemove, pickerOptions }) {
  const [showPicker, setShowPicker] = useState(false)

  const matchColor =
    !result ? '' :
    result.match_percentage >= 80 ? 'bg-forest' :
    result.match_percentage >= 60 ? 'bg-harvest' : 'bg-rust'

  return (
    <div className="relative">
      {result ? (
        <div className="group relative overflow-hidden rounded-xl border border-olive/20 bg-white shadow-sm transition hover:shadow-md">
          {result.recipe.image
            ? <img src={result.recipe.image} alt={result.recipe.title} className="h-20 w-full object-cover" />
            : <div className="flex h-20 items-center justify-center bg-olive-light text-bark-light/20"><Bowl size={22} /></div>
          }
          <div className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-black text-white ${matchColor}`}>
            {Math.round(result.match_percentage)}%
          </div>
          <button
            type="button"
            onClick={() => onRemove(day, mealType)}
            className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-bark-light opacity-0 shadow transition group-hover:opacity-100 hover:text-red-500"
            aria-label="Remove"
          >
            <X size={10} />
          </button>
          <div className="p-2">
            <p className="line-clamp-2 text-[11px] font-bold leading-snug text-bark">{result.recipe.title}</p>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-bark-light/55">
              {typeof result.recipe.readyInMinutes === 'number' && (
                <span className="inline-flex items-center gap-0.5"><Clock size={8} />{result.recipe.readyInMinutes}m</span>
              )}
              {result.nutrition?.calories > 0 && (
                <span className="inline-flex items-center gap-0.5"><Flame size={8} />{Math.round(result.nutrition.calories)}</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex h-[4.5rem] w-full items-center justify-center rounded-xl border-2 border-dashed border-olive/25 bg-white/40 text-bark-light/30 transition hover:border-forest/40 hover:bg-white/70 hover:text-forest"
        >
          <span className="text-xl font-thin leading-none">+</span>
        </button>
      )}

      {showPicker && (
        <RecipePicker
          options={pickerOptions}
          onPick={r => onAssign(day, mealType, r)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function MealPlanView({ results, favs, expirations }) {
  const { plan, DAYS, DAY_SHORT, MEAL_TYPES, assign, remove, clear, generate, plannedCount, uniqueMissing } = useMealPlan()
  const weekDates = getWeekDates()

  const favResults = favs.map(f => ({
    recipe: f,
    match_percentage: f.match_percentage ?? 0,
    missing_ingredients: f.missing_ingredients ?? [],
    nutrition: f.nutrition ?? null,
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
            {plannedCount} meal{plannedCount !== 1 ? 's' : ''} planned
            {uniqueMissing.length > 0 && ` · ${uniqueMissing.length} items to buy`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => generate(results)}
            disabled={results.length === 0}
            className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundImage: 'linear-gradient(90deg, #3d5c2e 0%, #5c7a42 50%, #3d5c2e 100%)' }}
          >
            <Zap size={14} /> Generate Smart Plan
          </button>
          {plannedCount > 0 && (
            <button type="button" onClick={clear}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100">
              Clear
            </button>
          )}
        </div>
      </div>

      {pickerOptions.length === 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run a recipe search on Home first — results will appear here as options to plan with.
        </div>
      )}

      {/* Calendar grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[780px]">

          {/* Day header row */}
          <div className="mb-2 flex gap-2">
            {/* Meal type label gutter */}
            <div className="w-[88px] shrink-0" />
            {/* Day columns */}
            {DAYS.map((day, i) => {
              const today = isToday(weekDates[i])
              return (
                <div key={day} className="flex-1 text-center">
                  <div className={`rounded-xl px-2 py-2 ${today ? 'bg-forest text-white' : 'bg-white/60'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${today ? 'text-white/75' : 'text-bark-light/50'}`}>
                      {DAY_SHORT[i]}
                    </p>
                    <p className={`mt-0.5 text-sm font-bold ${today ? 'text-white' : 'text-bark'}`}>
                      {fmtDate(weekDates[i])}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Meal type rows */}
          {MEAL_TYPES.map(mealType => (
            <div key={mealType} className="mb-2 flex gap-2">
              {/* Meal type label */}
              <div className="flex w-[88px] shrink-0 items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-bark-light/45">{mealType}</span>
              </div>
              {/* Cells */}
              {DAYS.map(day => (
                <div key={day} className="flex-1">
                  <MealCell
                    day={day}
                    mealType={mealType}
                    result={plan[day]?.[mealType]}
                    onAssign={assign}
                    onRemove={remove}
                    pickerOptions={pickerOptions}
                  />
                </div>
              ))}
            </div>
          ))}

        </div>
      </div>

      {/* Weekly summary */}
      {plannedCount > 0 && (
        <div className="mt-8 grid gap-3 rounded-2xl border border-olive/20 bg-white p-5 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-2xl font-black text-bark">{plannedCount}</p>
            <p className="text-xs text-bark-light/55">Meals planned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-bark">{uniqueMissing.length}</p>
            <p className="text-xs text-bark-light/55">Items to buy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-bark">
              {Object.values(plan)
                .flatMap(day => Object.values(day))
                .filter(r => r?.missing_ingredients?.length === 0).length}
            </p>
            <p className="text-xs text-bark-light/55">Cook-ready meals</p>
          </div>
        </div>
      )}
    </div>
  )
}
