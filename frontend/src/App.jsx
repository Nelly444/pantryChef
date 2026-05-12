import { useCallback, useState, useRef } from 'react'
import Accordion from './components/Accordion.jsx'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import { HeartFilled, HeartOutline, Bowl, Plate, Clock, Users, Sprout, Leaf, Flame, Zap, Droplet, Wheat, Check, CheckCircle } from './components/Icons.jsx'
import TopProgress from './components/TopProgress.jsx'
import { suggestRecipe } from './lib/api.js'
import { stripHtml, cleanSummary } from './lib/text.js'

const STAPLES = ['eggs', 'onion', 'garlic', 'rice', 'chicken breast', 'tomato', 'olive oil', 'pasta']

function scrollToId(id) {
  const el = document.getElementById(id)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Pantry Coverage Bar ──────────────────────────────────────────
function CoverageBar({ pct }) {
  const p = Math.min(100, Math.max(0, pct ?? 0))
  const color = p >= 75 ? '#4e7a42' : p >= 40 ? '#9b8b4a' : '#8b3d20'
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs font-semibold mb-1" style={{color:'#5c3d1e'}}>
        <span>Pantry coverage</span>
        <span style={{color}}>{p}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#d8e4c0] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${p}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ── Favorites ────────────────────────────────────────────────────
function useFavorites() {
  const [favs, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pantryChefFavs') || '[]') }
    catch { return [] }
  })
  const toggle = (recipe, matchPct) => {
    setFavs(prev => {
      const exists = prev.some(f => f.id === recipe.id)
      const next = exists
        ? prev.filter(f => f.id !== recipe.id)
        : [{ id: recipe.id, title: recipe.title, image: recipe.image, matchPct, savedAt: Date.now() }, ...prev].slice(0, 20)
      try { localStorage.setItem('pantryChefFavs', JSON.stringify(next)) } catch {}
      return next
    })
  }
  const isFav = (id) => favs.some(f => f.id === id)
  return { favs, toggle, isFav }
}

// ── Cooking Mode ─────────────────────────────────────────────────
function CookingMode({ steps, onClose }) {
  const [step, setStep] = useState(0)
  const total = steps.length
  if (!total) return null
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#2c1f0e]/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-[#8a9a6a]/40 bg-[#f4f0e6] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-[#2c1f0e]/10 text-[#2c1f0e] hover:bg-[#2c1f0e]/20"
        >
          ✕
        </button>

        {/* Progress dots */}
        <div className="mb-6 flex flex-wrap justify-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className="h-2.5 rounded-full transition-all"
              style={{
                width: i === step ? '2rem' : '0.625rem',
                backgroundColor: i <= step ? '#3d5c2e' : '#d8e4c0',
              }}
            />
          ))}
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#3d5c2e]">
          Step {step + 1} of {total}
        </p>
        <p
          key={step}
          style={{fontFamily:'"Playfair Display",Georgia,serif'}}
          className="step-in min-h-[80px] text-xl font-bold leading-snug text-[#2c1f0e]"
        >
          {steps[step]}
        </p>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(s => s - 1)}
            className="flex-1 rounded-xl border-2 border-[#8a9a6a]/40 bg-transparent py-3 text-sm font-bold text-[#5c3d1e] transition hover:bg-[#e2ead4] disabled:opacity-30"
          >
            ← Back
          </button>
          {step < total - 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              style={{backgroundColor:'#3d5c2e'}}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              style={{backgroundColor:'#4e7a42'}}
            >
              <CheckCircle size={16} className="inline mr-1.5" /> Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Favorites Drawer ──────────────────────────────────────────────
function FavoritesDrawer({ favs, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[300] flex justify-end bg-[#2c1f0e]/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-sm overflow-y-auto bg-[#f4f0e6] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b-2 border-[#8a9a6a]/30 bg-[#f4f0e6] px-5 py-4">
          <h2 style={{fontFamily:'"Playfair Display",Georgia,serif'}} className="flex items-center gap-2 text-xl font-bold text-[#2c1f0e]">
            <HeartFilled size={18} className="text-[#3d5c2e]" /> Saved Recipes
          </h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-[#2c1f0e]/10 text-[#2c1f0e] hover:bg-[#2c1f0e]/20">✕</button>
        </div>
        {favs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-[#5c3d1e]/60">
            <Bowl size={48} className="opacity-40" />
            <p className="text-sm">No saved recipes yet.</p>
            <p className="text-xs">Tap the heart on any recipe card.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#8a9a6a]/20 px-4 py-2">
            {favs.map(f => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => { onSelect(f); onClose(); }}
                  className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-[#e2ead4]/60 rounded-xl px-2"
                >
                  {f.image ? (
                    <img src={f.image} alt="" className="h-14 w-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-[#d8e4c0] shrink-0 grid place-items-center text-[#5c3d1e]/50"><Plate size={24} /></div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#2c1f0e] line-clamp-2">{f.title}</p>
                    <p className="text-xs text-[#7a9e6e] mt-0.5">{f.matchPct}% pantry match</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [ingredient, setIngredient] = useState('')
  const [ingredientsList, setIngredientsList] = useState([])
  const [inputHint, setInputHint] = useState('')
  const [dietaryText, setDietaryText] = useState('')
  const [meal, setMeal] = useState('')
  const [serving, setServing] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [cookingMode, setCookingMode] = useState(false)
  const [showFavs, setShowFavs] = useState(false)
  const heartRef = useRef(null)
  const { favs, toggle: toggleFav, isFav } = useFavorites()

  const addIngredient = useCallback((raw) => {
    const next = raw.trim()
    if (!next) { setInputHint('Enter an ingredient.'); return }
    const lower = next.toLowerCase()
    if (ingredientsList.some(x => x.toLowerCase() === lower)) { setInputHint('Already in list.'); return }
    setIngredientsList(prev => [...prev, next])
    setIngredient('')
    setInputHint('')
  }, [ingredientsList])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addIngredient(ingredient) }
  }

  const parseDietary = () => {
    const parts = dietaryText.split(',').map(s => s.trim()).filter(Boolean)
    return parts.length ? parts : null
  }

  const handleSuggest = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    if (ingredientsList.length === 0) { setError('Add at least one ingredient.'); scrollToId('cook'); return }
    setLoading(true)
    try {
      const payload = {
        ingredients: ingredientsList,
        serving: Math.max(1, Number(serving) || 1),
        meal: meal || null,
        dietary_restrictions: parseDietary(),
      }
      const data = await suggestRecipe(payload)
      setResult(data)
      setHistory(prev => [
        { result: data, ingredients: [...ingredientsList], timestamp: new Date() },
        ...prev.slice(0, 4),
      ])
      requestAnimationFrame(() => scrollToId('result'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (key) => {
    if (key === 'cook') scrollToId('cook')
    if (key === 'result') scrollToId('result')
  }

  // Build cooking steps from extendedIngredients + summary as fallback
  const getCookingSteps = () => {
    const r = result?.recipe
    if (!r) return []
    const analyzed = r.analyzedInstructions?.[0]?.steps?.map(s => s.step).filter(Boolean) ?? []
    if (analyzed.length > 0) return analyzed
    // fallback: split summary into sentences
    const raw = stripHtml(r.summary || '')
    return raw.match(/[^.!?]+[.!?]+(\s|$)/g)?.map(s => s.trim()).filter(Boolean).slice(0, 12) ?? []
  }

  const recipe = result?.recipe
  const summaryPlain = cleanSummary(recipe?.summary ?? '')
  const nutrition = result?.nutrition
  const cookingSteps = getCookingSteps()

  // Input style shared
  const inputCls = "w-full rounded-xl border-2 border-[#8a9a6a]/40 bg-white px-4 py-3 text-sm text-[#2c1f0e] outline-none placeholder:text-gray-400 focus:border-[#3d5c2e] focus:ring-2 focus:ring-[#3d5c2e]/15 transition"

  return (
    <div id="top" className="flex min-h-screen flex-col" style={{backgroundColor:'#f4f0e6'}}>
      <TopProgress active={loading} />
      <Header onNavigate={handleNavigate} />

      {/* Cooking Mode overlay */}
      {cookingMode && cookingSteps.length > 0 && (
        <CookingMode steps={cookingSteps} onClose={() => setCookingMode(false)} />
      )}

      {/* Favorites Drawer */}
      {showFavs && (
        <FavoritesDrawer
          favs={favs}
          onClose={() => setShowFavs(false)}
          onSelect={(fav) => {
            // Just open the saved result if we have it in history
            const h = history.find(h => h.result?.recipe?.id === fav.id)
            if (h) { setResult(h.result); requestAnimationFrame(() => scrollToId('result')) }
          }}
        />
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">

        {/* Hero */}
        <section className="mb-12 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#3d5c2e]">Your kitchen, your recipe</p>
            <h1 style={{fontFamily:'"Playfair Display",Georgia,serif'}} className="text-4xl font-black italic leading-tight text-[#2c1f0e] sm:text-5xl">
              Cook with<br className="hidden sm:block" /> what you have.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5c3d1e]/80">
              Add your pantry ingredients. We will find the best recipe you can make right now, no shopping needed.
            </p>
          </div>
          {/* Favorites button */}
          <button
            type="button"
            onClick={() => setShowFavs(true)}
            className="shrink-0 flex flex-col items-center gap-1 rounded-2xl border-2 border-[#8a9a6a]/40 bg-white px-4 py-3 text-[#3d5c2e] shadow-sm hover:bg-[#e2ead4] transition"
          >
            <HeartFilled size={22} />
            <span className="text-xs font-bold text-[#5c3d1e]">Saved</span>
            {favs.length > 0 && (
              <span className="rounded-full bg-[#3d5c2e] px-2 py-0.5 text-[10px] font-bold text-white">{favs.length}</span>
            )}
          </button>
        </section>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">

          {/* ── Left: Pantry Panel ── */}
          <div id="cook" className="lg:col-span-5">
            <div className="rounded-3xl border-2 border-[#8a9a6a]/35 bg-white p-5 shadow-md sm:p-6">

              {/* Panel header */}
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 style={{fontFamily:'"Playfair Display",Georgia,serif'}} className="text-xl font-bold text-[#2c1f0e]">
                    Your Pantry
                  </h2>
                  <p className="text-sm text-[#5c3d1e]/65">What's in your kitchen right now</p>
                </div>
                <div className="flex items-center gap-2">
                  {ingredientsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIngredientsList([])}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition"
                    >
                      Clear
                    </button>
                  )}
                  <details className="relative">
                    <summary className="cursor-pointer list-none rounded-xl border-2 border-[#8a9a6a]/40 bg-[#f4f0e6] px-3 py-1.5 text-xs font-bold text-[#5c3d1e] marker:hidden outline-none hover:bg-[#e2ead4] [&::-webkit-details-marker]:hidden">
                      + Quick add
                    </summary>
                    <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border-2 border-[#8a9a6a]/30 bg-white py-1 shadow-xl">
                      {STAPLES.map(s => (
                        <button
                          key={s}
                          type="button"
                          className="block w-full px-4 py-2.5 text-left text-sm text-[#2c1f0e] hover:bg-[#f4f0e6] capitalize"
                          onClick={() => addIngredient(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              </div>

              {/* Ingredient input */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  id="ingredient"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. Greek yogurt"
                  value={ingredient}
                  onChange={e => { setIngredient(e.target.value); if (inputHint) setInputHint('') }}
                  onKeyDown={handleKeyDown}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => addIngredient(ingredient)}
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:translate-y-px sm:w-24"
                  style={{backgroundColor:'#3d5c2e'}}
                >
                  Add
                </button>
              </div>
              {inputHint && <p className="mt-2 text-sm text-amber-700">{inputHint}</p>}

              {/* Tags */}
              {ingredientsList.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {ingredientsList.map(item => (
                    <span
                      key={item}
                      className="pantry-tag inline-flex items-center gap-1 rounded-full border-2 border-[#7a9e6e]/40 bg-[#7a9e6e]/10 px-3 py-1 text-sm font-semibold text-[#2c1f0e]"
                    >
                      {item}
                      <button
                        type="button"
                        className="ml-1 grid h-5 w-5 place-items-center rounded-full text-[#4e7a42] hover:bg-[#7a9e6e]/20"
                        onClick={() => setIngredientsList(prev => prev.filter(x => x !== item))}
                        aria-label={`Remove ${item}`}
                      >×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border-2 border-dashed border-[#8a9a6a]/40 bg-[#f4f0e6] px-4 py-3 text-sm text-[#5c3d1e]/60">
                  Type or press Enter to add · or use Quick add ↗
                </p>
              )}

              {/* Options */}
              <div className="mt-6 border-t-2 border-[#8a9a6a]/20 pt-5">
                <form onSubmit={handleSuggest} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="servings" className="block text-xs font-bold uppercase tracking-widest text-[#5c3d1e]/60 mb-2">Servings</label>
                      <input
                        id="servings"
                        type="number"
                        min={1}
                        value={serving}
                        onChange={e => setServing(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="meal" className="block text-xs font-bold uppercase tracking-widest text-[#5c3d1e]/60 mb-2">Meal type</label>
                      <select
                        id="meal"
                        value={meal}
                        onChange={e => setMeal(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Any</option>
                        <option value="breakfast">Breakfast</option>
                        <option value="brunch">Brunch</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dietary" className="block text-xs font-bold uppercase tracking-widest text-[#5c3d1e]/60 mb-2">Dietary notes</label>
                    <input
                      id="dietary"
                      type="text"
                      placeholder="e.g. vegetarian, gluten free"
                      value={dietaryText}
                      onChange={e => setDietaryText(e.target.value)}
                      className={inputCls}
                    />
                    <p className="mt-1 text-xs text-[#5c3d1e]/50">Separate with commas</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl py-4 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{backgroundColor:'#2c1f0e'}}
                  >
                    {loading ? 'Finding your best match...' : 'Suggest a recipe'}
                  </button>
                </form>
              </div>
            </div>

            {/* Recent history */}
            {history.length > 1 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#5c3d1e]/60">Recent searches</p>
                <div className="flex flex-wrap gap-2">
                  {history.slice(1).map((h, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setResult(h.result); setIngredientsList(h.ingredients); requestAnimationFrame(() => scrollToId('result')) }}
                      className="rounded-full border-2 border-[#8a9a6a]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#5c3d1e] shadow-sm hover:bg-[#e2ead4] transition"
                    >
                      {h.result?.recipe?.title?.slice(0, 26) ?? 'Recipe'}{(h.result?.recipe?.title?.length ?? 0) > 26 ? '…' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Result Panel ── */}
          <div id="result" className="lg:col-span-7">
            {error && (
              <div role="alert" className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm">
                <p className="font-bold">Something went wrong</p>
                <p className="mt-2 leading-relaxed">{error}</p>
                <button type="button" className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-800 hover:bg-red-50" onClick={() => setError('')}>Dismiss</button>
              </div>
            )}

            {!result && !error && (
              <div className="rounded-3xl border-2 border-dashed border-[#8a9a6a]/40 bg-white/60 p-10 text-center">
                <div className="mx-auto mb-4 text-[#5c3d1e]/30"><Bowl size={56} /></div>
                <p style={{fontFamily:'"Playfair Display",Georgia,serif'}} className="text-xl font-bold italic text-[#2c1f0e]">
                  Your recipe will appear here.
                </p>
                <p className="mt-2 text-sm text-[#5c3d1e]/65">
                  Add ingredients to your pantry, then click <strong>Suggest a recipe</strong>.
                </p>
              </div>
            )}

            {result && recipe && (
              <div className="space-y-4">
                {/* Recipe card */}
                <div className="overflow-hidden rounded-3xl border-2 border-[#8a9a6a]/35 bg-white shadow-lg">
                  <div className="grid md:grid-cols-5">
                    {/* Image */}
                    <div className="relative md:col-span-2">
                      {recipe.image ? (
                        <img
                          src={recipe.image}
                          alt={recipe.title ?? 'Recipe'}
                          className="h-52 w-full object-cover md:h-full md:min-h-[260px]"
                        />
                      ) : (
                        <div className="flex h-52 items-center justify-center text-[#5c3d1e]/30" style={{backgroundColor:'#d8e4c0'}}><Plate size={48} /></div>
                      )}
                      <div className="absolute left-3 top-3 rounded-full border border-white/60 px-3 py-1 text-xs font-bold text-white shadow" style={{backgroundColor:'#2c1f0e'}}>
                        {result.match_percentage}% match
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-between p-5 md:col-span-3">
                      <div>
                        <div className="flex items-start gap-2">
                          <h2 style={{fontFamily:'"Playfair Display",Georgia,serif'}} className="flex-1 text-2xl font-black italic leading-snug text-[#2c1f0e]">
                            {recipe.title}
                          </h2>
                          {/* Favorite button */}
                          <button
                            ref={heartRef}
                            type="button"
                            onClick={() => {
                              toggleFav(recipe, result.match_percentage)
                              heartRef.current?.classList.remove('heart-pop')
                              void heartRef.current?.offsetWidth
                              heartRef.current?.classList.add('heart-pop')
                            }}
                            className="shrink-0 transition hover:scale-110 text-[#3d5c2e]"
                            title={isFav(recipe.id) ? 'Remove from saved' : 'Save recipe'}
                          >
                            {isFav(recipe.id) ? <HeartFilled size={22} /> : <HeartOutline size={22} />}
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {typeof recipe.readyInMinutes === 'number' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#8a9a6a]/40 bg-[#f4f0e6] px-3 py-1 text-xs font-bold text-[#5c3d1e]"><Clock size={12} /> {recipe.readyInMinutes} min</span>
                          )}
                          {typeof recipe.servings === 'number' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#8a9a6a]/40 bg-[#f4f0e6] px-3 py-1 text-xs font-bold text-[#5c3d1e]"><Users size={12} /> Serves {recipe.servings}</span>
                          )}
                          {recipe.vegetarian && <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#7a9e6e]/40 bg-[#7a9e6e]/10 px-3 py-1 text-xs font-bold text-[#4e7a42]"><Leaf size={12} /> Vegetarian</span>}
                          {recipe.vegan && <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#7a9e6e]/40 bg-[#7a9e6e]/10 px-3 py-1 text-xs font-bold text-[#4e7a42]"><Sprout size={12} /> Vegan</span>}
                        </div>

                        {/* Coverage bar */}
                        <CoverageBar pct={result.match_percentage} />

                        {/* Nutrition */}
                        {nutrition && (
                          <div className="mt-4 grid grid-cols-4 gap-2">
                            {[
                              [<Flame size={14} />, 'Calories', Math.round(nutrition.calories ?? 0), ''],
                              [<Zap size={14} />, 'Protein', Math.round(nutrition.protein ?? 0), 'g'],
                              [<Droplet size={14} />, 'Fat', Math.round(nutrition.fat ?? 0), 'g'],
                              [<Wheat size={14} />, 'Carbs', Math.round(nutrition.carbs ?? 0), 'g'],
                            ].map(([icon, label, val, unit]) => (
                              <div key={label} className="rounded-xl border-2 border-[#8a9a6a]/25 bg-[#f4f0e6] px-2 py-2 text-center">
                                <p className="flex justify-center text-[#5c3d1e]/60 mb-0.5">{icon}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-[#5c3d1e]/60">{label}</p>
                                <p className="font-black text-[#2c1f0e]">{val}{unit}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {/* Cook mode button */}
                        {cookingSteps.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setCookingMode(true)}
                            className="rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                            style={{backgroundColor:'#3d5c2e'}}
                          >
                            Start Cooking
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="rounded-xl border-2 border-[#8a9a6a]/40 bg-[#f4f0e6] px-4 py-2.5 text-sm font-bold text-[#5c3d1e] hover:bg-[#e2ead4] transition"
                        >
                          Print recipe
                        </button>
                        {recipe.sourceUrl && (
                          <a
                            href={recipe.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border-2 border-[#8a9a6a]/40 bg-[#f4f0e6] px-4 py-2.5 text-sm font-bold text-[#5c3d1e] hover:bg-[#e2ead4] transition"
                          >
                            View source ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accordions */}
                <Accordion title="Missing ingredients" defaultOpen>
                  {result.missing_ingredients?.length ? (
                    <ul className="space-y-2">
                      {result.missing_ingredients.map(m => (
                        <li key={m} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{backgroundColor:'#3d5c2e'}} />
                          {m}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="flex items-center gap-2 text-[#4e7a42] font-semibold"><Check size={16} /> You have everything for this recipe.</p>
                  )}
                </Accordion>

                <Accordion title="Recipe details">
                  {summaryPlain ? (
                    <div className="space-y-3 leading-relaxed text-[#5c3d1e]">
                      {(() => {
                        const sentences = summaryPlain.match(/[^.!?]+[.!?]+(\s|$)/g) || [summaryPlain]
                        const cleaned = sentences.map(s => s.trim()).filter(Boolean)
                        const paras = []
                        for (let i = 0; i < cleaned.length; i += 3) paras.push(cleaned.slice(i, i + 3).join(' '))
                        return paras.map((p, i) => <p key={i}>{p}</p>)
                      })()}
                    </div>
                  ) : (
                    <p className="text-[#5c3d1e]/60">No summary available.</p>
                  )}
                </Accordion>

                <Accordion title="Full ingredient list">
                  {Array.isArray(recipe.extendedIngredients) && recipe.extendedIngredients.length > 0 ? (
                    <ul className="space-y-2">
                      {recipe.extendedIngredients.map(ing => (
                        <li key={ing.id ?? ing.original} className="flex items-start gap-2 border-b border-[#8a9a6a]/20 py-2 last:border-0">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{backgroundColor:'#7a9e6e'}} />
                          {ing.original || ing.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#5c3d1e]/60">Ingredient list unavailable.</p>
                  )}
                </Accordion>

                <Accordion title="Nutrition (scaled to your servings)">
                  {nutrition ? (
                    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        ['Calories', Math.round(nutrition.calories ?? 0), ''],
                        ['Protein', Math.round(nutrition.protein ?? 0), 'g'],
                        ['Fat', Math.round(nutrition.fat ?? 0), 'g'],
                        ['Carbs', Math.round(nutrition.carbs ?? 0), 'g'],
                      ].map(([label, val, unit]) => (
                        <div key={label} className="rounded-xl border-2 border-[#8a9a6a]/25 bg-[#f4f0e6] px-3 py-2">
                          <dt className="text-xs font-bold uppercase tracking-wide text-[#5c3d1e]/60">{label}</dt>
                          <dd className="text-lg font-black text-[#2c1f0e]">{val}{unit}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : <p className="text-[#5c3d1e]/60">No nutrition data.</p>}
                </Accordion>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}