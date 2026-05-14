import { useState } from 'react'
import ShineBorder from './ui/ShineBorder.jsx'
import { Search, Leaf } from './Icons.jsx'
import { validateIngredient, validateDietTerm } from '../lib/validate.js'

const STAPLES = ['eggs', 'onion', 'garlic', 'rice', 'chicken breast', 'tomato', 'olive oil', 'pasta']

const inputCls = 'w-full rounded-xl border border-olive/30 bg-white px-4 py-2.5 text-sm text-bark outline-none placeholder:text-gray-400 focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-forest/20 transition'

export default function HeroSection({ ingredientsList, onAdd, onRemove, onClear, serving, setServing, onSearch, loading }) {
  const [ingredient, setIngredient] = useState('')
  const [inputHint, setInputHint]   = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [meal, setMeal]             = useState('')
  const [dietaryText, setDietaryText] = useState('')

  const tryAdd = (raw) => {
    const err = validateIngredient(raw)
    if (err) { setInputHint(err); return }
    const result = onAdd(raw.trim())
    if (result === false) { setInputHint('Already added.'); return }
    setIngredient('')
    setInputHint('')
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (ingredientsList.length === 0) { setInputHint('Add at least one ingredient first.'); return }
    const terms = dietaryText.split(',').map(s => s.trim()).filter(Boolean)
    const valid = terms.filter(s => validateDietTerm(s) === null)
    const invalid = terms.filter(s => validateDietTerm(s) !== null)
    if (invalid.length) {
      setInputHint(`Ignored unrecognised dietary terms: ${invalid.join(', ')}`)
    }
    onSearch({ meal: meal || null, dietary: valid.length ? valid : null })
  }

  return (
    <section className="relative overflow-hidden border-b border-olive/20 bg-gradient-to-b from-forest/20 via-sage/10 to-cream py-14 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-sage/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-20 h-64 w-64 rounded-full bg-forest/12 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <p className="mb-3 text-center text-xs font-black uppercase tracking-widest text-forest">
          Powered by your pantry
        </p>
        <h1 className="font-display mb-8 text-center text-4xl font-black italic leading-tight text-bark sm:text-5xl">
          Your pantry<br className="hidden sm:block" /> has a recipe.
        </h1>

        <ShineBorder borderRadius={20} borderWidth={2} duration={3} color={['#3d5c2e', '#7a9e6e', '#d8e4c0', '#8a9a6a']} className="shadow-lg">
          <form onSubmit={handleSubmit} className="p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-light/40" />
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Type an ingredient and press Enter…"
                  maxLength={60}
                  value={ingredient}
                  onChange={e => { setIngredient(e.target.value); if (inputHint) setInputHint('') }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); tryAdd(ingredient) } }}
                  className="w-full rounded-xl border border-olive/20 bg-cream/60 py-3 pl-9 pr-4 text-sm text-bark outline-none placeholder:text-gray-400 focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-forest/20 transition"
                />
              </div>
              <button type="button" onClick={() => tryAdd(ingredient)}
                className="btn-ghost rounded-xl border border-olive/20 bg-cream px-4 py-3 text-sm font-bold text-bark-light hover:bg-cream-dark">
                Add
              </button>
              <button type="submit" disabled={loading || ingredientsList.length === 0}
                className="btn-shimmer rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundImage: loading ? undefined : 'linear-gradient(90deg, #3d5c2e 0%, #5c7a42 50%, #3d5c2e 100%)' }}>
                {loading ? 'Searching…' : 'Find Recipes'}
              </button>
            </div>

            {ingredientsList.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-olive/15 pt-3">
                {ingredientsList.map(item => (
                  <span key={item} className="pantry-tag inline-flex items-center gap-1 rounded-full border border-sage/40 bg-sage/10 px-3 py-1 text-sm font-semibold text-bark">
                    {item}
                    <button type="button" onClick={() => onRemove(item)}
                      className="ml-0.5 grid h-4 w-4 place-items-center rounded-full text-sage-dark hover:bg-sage/20"
                      aria-label={`Remove ${item}`}>×</button>
                  </span>
                ))}
                <button type="button" onClick={onClear}
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-500 transition hover:bg-red-100">
                  Clear all
                </button>
              </div>
            )}
            {inputHint && <p className="mt-2 text-sm text-amber-700">{inputHint}</p>}
          </form>
        </ShineBorder>

        {/* Quick-add staples */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="self-center text-xs text-bark-light/50">Quick add:</span>
          {STAPLES.map(s => (
            <button key={s} type="button" onClick={() => tryAdd(s)}
              disabled={ingredientsList.some(x => x.toLowerCase() === s)}
              className="rounded-full border border-olive/25 bg-white/70 px-3 py-1 text-xs font-semibold text-bark-light transition hover:border-forest/40 hover:text-bark disabled:cursor-not-allowed disabled:opacity-40">
              {s}
            </button>
          ))}
        </div>

        {/* Collapsible filters */}
        <div className="mt-5 flex justify-center">
          <button type="button" onClick={() => setShowOptions(o => !o)}
            className="text-xs font-bold text-bark-light/50 transition hover:text-bark-light">
            {showOptions ? '▲ Hide filters' : '▼ Meal type · Servings · Dietary'}
          </button>
        </div>

        {showOptions && (
          <div className="mt-3 grid gap-3 rounded-2xl border border-olive/20 bg-white/80 p-4 sm:grid-cols-3">
            <div>
              <label htmlFor="serving" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-bark-light/55">Servings</label>
              <input id="serving" type="number" min={1} max={20} value={serving}
                onChange={e => { const v = parseInt(e.target.value, 10); setServing(isNaN(v) ? 1 : Math.min(20, Math.max(1, v))) }}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="meal" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-bark-light/55">Meal Type</label>
              <select id="meal" value={meal} onChange={e => setMeal(e.target.value)} className={inputCls}>
                <option value="">Any</option>
                {['breakfast','brunch','lunch','dinner','snack'].map(m => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dietary" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-bark-light/55">Dietary</label>
              <input id="dietary" type="text" placeholder="vegetarian, gluten free…" maxLength={200}
                value={dietaryText} onChange={e => setDietaryText(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
