import { useCallback, useState, useRef } from 'react'
import Accordion from './components/Accordion.jsx'
import CookingMode from './components/CookingMode.jsx'
import CoverageBar from './components/CoverageBar.jsx'
import FavoritesDrawer from './components/FavoritesDrawer.jsx'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import { HeartFilled, HeartOutline, Bowl, Plate, Clock, Users, Sprout, Leaf, Flame, Zap, Droplet, Wheat, Check } from './components/Icons.jsx'
import TopProgress from './components/TopProgress.jsx'
import { suggestRecipe } from './lib/api.js'
import { stripHtml, cleanSummary } from './lib/text.js'
import { validateIngredient, validateDietTerm, isSafeUrl } from './lib/validate.js'
import { useFavorites } from './hooks/useFavorites.js'

const STAPLES = ['eggs', 'onion', 'garlic', 'rice', 'chicken breast', 'tomato', 'olive oil', 'pasta']

// Shared input style — defined once, used across all form controls.
// Uses design tokens from tailwind.config.js (olive, bark, forest).
const inputCls = 'w-full rounded-xl border-2 border-olive/40 bg-white px-4 py-3 text-sm text-bark outline-none placeholder:text-gray-400 focus:border-forest focus:ring-2 focus:ring-forest/15 transition'

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function App() {
  const [ingredient, setIngredient]         = useState('')
  const [ingredientsList, setIngredientsList] = useState([])
  const [inputHint, setInputHint]           = useState('')
  const [dietaryText, setDietaryText]       = useState('')
  const [meal, setMeal]                     = useState('')
  const [serving, setServing]               = useState(1)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [result, setResult]                 = useState(null)
  const [history, setHistory]               = useState([])
  const [cookingMode, setCookingMode]       = useState(false)
  const [showFavs, setShowFavs]             = useState(false)
  const heartRef = useRef(null)
  const { favs, toggle: toggleFav, isFav }  = useFavorites()

  const addIngredient = useCallback((raw) => {
    const error = validateIngredient(raw)
    if (error) { setInputHint(error); return }
    const next = raw.trim()
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
    const valid = parts.filter(term => validateDietTerm(term) === null)
    return valid.length ? valid : null
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
        serving: Math.max(1, Math.min(20, Number(serving) || 1)),
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

  const getCookingSteps = () => {
    const r = result?.recipe
    if (!r) return []
    const analyzed = r.analyzedInstructions?.[0]?.steps?.map(s => s.step).filter(Boolean) ?? []
    if (analyzed.length > 0) return analyzed
    const raw = stripHtml(r.summary || '')
    return raw.match(/[^.!?]+[.!?]+(\s|$)/g)?.map(s => s.trim()).filter(Boolean).slice(0, 12) ?? []
  }

  const recipe        = result?.recipe
  const summaryPlain  = cleanSummary(recipe?.summary ?? '')
  const nutrition     = result?.nutrition
  const cookingSteps  = getCookingSteps()

  return (
    <div id="top" className="flex min-h-screen flex-col bg-cream">
      <TopProgress active={loading} />
      <Header onNavigate={(key) => scrollToId(key)} />

      {cookingMode && cookingSteps.length > 0 && (
        <CookingMode steps={cookingSteps} onClose={() => setCookingMode(false)} />
      )}

      {showFavs && (
        <FavoritesDrawer
          favs={favs}
          onClose={() => setShowFavs(false)}
          onSelect={(fav) => {
            const h = history.find(h => h.result?.recipe?.id === fav.id)
            if (h) { setResult(h.result); requestAnimationFrame(() => scrollToId('result')) }
          }}
        />
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">

        {/* ── Hero ── */}
        <section className="mb-12 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-forest">
              Your kitchen, your recipe
            </p>
            <h1 className="font-display text-4xl font-black italic leading-tight text-bark sm:text-5xl">
              Cook with<br className="hidden sm:block" /> what you have.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-bark-light/80">
              Add your pantry ingredients. We will find the best recipe you can make right now, no shopping needed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFavs(true)}
            aria-label="Open saved recipes"
            className="shrink-0 flex flex-col items-center gap-1 rounded-2xl border-2 border-olive/40 bg-white px-4 py-3 text-forest shadow-sm hover:bg-cream-dark transition"
          >
            <HeartFilled size={22} />
            <span className="text-xs font-bold text-bark-light">Saved</span>
            {favs.length > 0 && (
              <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-bold text-white">
                {favs.length}
              </span>
            )}
          </button>
        </section>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">

          {/* ── Left: Pantry Panel ── */}
          <div id="cook" className="lg:col-span-5">
            <div className="rounded-3xl border-2 border-olive/35 bg-white p-5 shadow-md sm:p-6">

              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-bark">Your Pantry</h2>
                  <p className="text-sm text-bark-light/65">What's in your kitchen right now</p>
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
                    <summary className="cursor-pointer list-none rounded-xl border-2 border-olive/40 bg-cream px-3 py-1.5 text-xs font-bold text-bark-light marker:hidden outline-none hover:bg-cream-dark [&::-webkit-details-marker]:hidden">
                      + Quick add
                    </summary>
                    <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border-2 border-olive/30 bg-white py-1 shadow-xl">
                      {STAPLES.map(s => (
                        <button
                          key={s}
                          type="button"
                          className="block w-full px-4 py-2.5 text-left text-sm text-bark hover:bg-cream capitalize"
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
                  maxLength={60}
                  value={ingredient}
                  onChange={e => { setIngredient(e.target.value); if (inputHint) setInputHint('') }}
                  onKeyDown={handleKeyDown}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => addIngredient(ingredient)}
                  className="inline-flex items-center justify-center rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:translate-y-px sm:w-24"
                >
                  Add
                </button>
              </div>
              {inputHint && <p className="mt-2 text-sm text-amber-700">{inputHint}</p>}

              {/* Ingredient tags */}
              {ingredientsList.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {ingredientsList.map(item => (
                    <span
                      key={item}
                      className="pantry-tag inline-flex items-center gap-1 rounded-full border-2 border-sage/40 bg-sage/10 px-3 py-1 text-sm font-semibold text-bark"
                    >
                      {item}
                      <button
                        type="button"
                        className="ml-1 grid h-5 w-5 place-items-center rounded-full text-sage-dark hover:bg-sage/20"
                        onClick={() => setIngredientsList(prev => prev.filter(x => x !== item))}
                        aria-label={`Remove ${item}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border-2 border-dashed border-olive/40 bg-cream px-4 py-3 text-sm text-bark-light/60">
                  Type or press Enter to add · or use Quick add ↗
                </p>
              )}

              {/* Form options */}
              <div className="mt-6 border-t-2 border-olive/20 pt-5">
                <form onSubmit={handleSuggest} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="servings" className="block text-xs font-bold uppercase tracking-widest text-bark-light/60 mb-2">
                        Servings
                      </label>
                      <input
                        id="servings"
                        type="number"
                        min={1}
                        max={20}
                        value={serving}
                        onChange={e => {
                          const v = parseInt(e.target.value, 10)
                          setServing(isNaN(v) ? 1 : Math.min(20, Math.max(1, v)))
                        }}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="meal" className="block text-xs font-bold uppercase tracking-widest text-bark-light/60 mb-2">
                        Meal type
                      </label>
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
                    <label htmlFor="dietary" className="block text-xs font-bold uppercase tracking-widest text-bark-light/60 mb-2">
                      Dietary notes
                    </label>
                    <input
                      id="dietary"
                      type="text"
                      placeholder="e.g. vegetarian, gluten free"
                      maxLength={510}
                      value={dietaryText}
                      onChange={e => setDietaryText(e.target.value)}
                      className={inputCls}
                    />
                    <p className="mt-1 text-xs text-bark-light/50">Separate with commas</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-bark py-4 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Finding your best match...' : 'Suggest a recipe'}
                  </button>
                </form>
              </div>
            </div>

            {/* Recent searches — key uses timestamp to avoid index-as-key anti-pattern */}
            {history.length > 1 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-bark-light/60">Recent searches</p>
                <div className="flex flex-wrap gap-2">
                  {history.slice(1).map((h) => (
                    <button
                      key={h.timestamp.getTime()}
                      type="button"
                      onClick={() => { setResult(h.result); setIngredientsList(h.ingredients); requestAnimationFrame(() => scrollToId('result')) }}
                      className="rounded-full border-2 border-olive/30 bg-white px-3 py-1.5 text-xs font-semibold text-bark-light shadow-sm hover:bg-cream-dark transition"
                    >
                      {h.result?.recipe?.title?.slice(0, 26) ?? 'Recipe'}
                      {(h.result?.recipe?.title?.length ?? 0) > 26 ? '…' : ''}
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
                <button
                  type="button"
                  className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-800 hover:bg-red-50"
                  onClick={() => setError('')}
                >
                  Dismiss
                </button>
              </div>
            )}

            {!result && !error && (
              <div className="rounded-3xl border-2 border-dashed border-olive/40 bg-white/60 p-10 text-center">
                <div className="mx-auto mb-4 text-bark-light/30"><Bowl size={56} /></div>
                <p className="font-display text-xl font-bold italic text-bark">
                  Your recipe will appear here.
                </p>
                <p className="mt-2 text-sm text-bark-light/65">
                  Add ingredients to your pantry, then click <strong>Suggest a recipe</strong>.
                </p>
              </div>
            )}

            {result && recipe && (
              <div className="space-y-4">
                {/* Recipe card */}
                <div className="overflow-hidden rounded-3xl border-2 border-olive/35 bg-white shadow-lg">
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
                        <div className="flex h-52 items-center justify-center bg-olive-light text-bark-light/30">
                          <Plate size={48} />
                        </div>
                      )}
                      <div className="absolute left-3 top-3 rounded-full border border-white/60 bg-bark px-3 py-1 text-xs font-bold text-white shadow">
                        {result.match_percentage}% match
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-between p-5 md:col-span-3">
                      <div>
                        <div className="flex items-start gap-2">
                          <h2 className="font-display flex-1 text-2xl font-black italic leading-snug text-bark">
                            {recipe.title}
                          </h2>
                          <button
                            ref={heartRef}
                            type="button"
                            onClick={() => {
                              toggleFav(recipe, result.match_percentage)
                              heartRef.current?.classList.remove('heart-pop')
                              void heartRef.current?.offsetWidth
                              heartRef.current?.classList.add('heart-pop')
                            }}
                            className="shrink-0 transition hover:scale-110 text-forest"
                            aria-label={isFav(recipe.id) ? 'Remove from saved' : 'Save recipe'}
                          >
                            {isFav(recipe.id) ? <HeartFilled size={22} /> : <HeartOutline size={22} />}
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {typeof recipe.readyInMinutes === 'number' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-olive/40 bg-cream px-3 py-1 text-xs font-bold text-bark-light">
                              <Clock size={12} /> {recipe.readyInMinutes} min
                            </span>
                          )}
                          {typeof recipe.servings === 'number' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-olive/40 bg-cream px-3 py-1 text-xs font-bold text-bark-light">
                              <Users size={12} /> Serves {recipe.servings}
                            </span>
                          )}
                          {recipe.vegetarian && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-sage/40 bg-sage/10 px-3 py-1 text-xs font-bold text-sage-dark">
                              <Leaf size={12} /> Vegetarian
                            </span>
                          )}
                          {recipe.vegan && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-sage/40 bg-sage/10 px-3 py-1 text-xs font-bold text-sage-dark">
                              <Sprout size={12} /> Vegan
                            </span>
                          )}
                        </div>

                        <CoverageBar pct={result.match_percentage} />

                        {nutrition && (
                          <div className="mt-4 grid grid-cols-4 gap-2">
                            {[
                              [<Flame size={14} />, 'Calories', Math.round(nutrition.calories ?? 0), ''],
                              [<Zap size={14} />,   'Protein',  Math.round(nutrition.protein  ?? 0), 'g'],
                              [<Droplet size={14} />, 'Fat',    Math.round(nutrition.fat      ?? 0), 'g'],
                              [<Wheat size={14} />, 'Carbs',    Math.round(nutrition.carbs    ?? 0), 'g'],
                            ].map(([icon, label, val, unit]) => (
                              <div key={label} className="rounded-xl border-2 border-olive/25 bg-cream px-2 py-2 text-center">
                                <p className="flex justify-center text-bark-light/60 mb-0.5">{icon}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-bark-light/60">{label}</p>
                                <p className="font-black text-bark">{val}{unit}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {cookingSteps.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setCookingMode(true)}
                            className="rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                          >
                            Start Cooking
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="rounded-xl border-2 border-olive/40 bg-cream px-4 py-2.5 text-sm font-bold text-bark-light hover:bg-cream-dark transition"
                        >
                          Print recipe
                        </button>
                        {isSafeUrl(recipe.sourceUrl) && (
                          <a
                            href={recipe.sourceUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="rounded-xl border-2 border-olive/40 bg-cream px-4 py-2.5 text-sm font-bold text-bark-light hover:bg-cream-dark transition"
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
                          <span className="h-2 w-2 rounded-full bg-forest shrink-0" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="flex items-center gap-2 text-sage-dark font-semibold">
                      <Check size={16} /> You have everything for this recipe.
                    </p>
                  )}
                </Accordion>

                <Accordion title="Recipe details">
                  {summaryPlain ? (
                    <div className="space-y-3 leading-relaxed text-bark-light">
                      {(() => {
                        const sentences = summaryPlain.match(/[^.!?]+[.!?]+(\s|$)/g) || [summaryPlain]
                        const cleaned   = sentences.map(s => s.trim()).filter(Boolean)
                        const paras     = []
                        for (let i = 0; i < cleaned.length; i += 3) paras.push(cleaned.slice(i, i + 3).join(' '))
                        return paras.map((p, i) => <p key={i}>{p}</p>)
                      })()}
                    </div>
                  ) : (
                    <p className="text-bark-light/60">No summary available.</p>
                  )}
                </Accordion>

                <Accordion title="Full ingredient list">
                  {Array.isArray(recipe.extendedIngredients) && recipe.extendedIngredients.length > 0 ? (
                    <ul className="space-y-2">
                      {recipe.extendedIngredients.map(ing => (
                        <li key={ing.id ?? ing.original} className="flex items-start gap-2 border-b border-olive/20 py-2 last:border-0">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sage" />
                          {ing.original || ing.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-bark-light/60">Ingredient list unavailable.</p>
                  )}
                </Accordion>

                <Accordion title="Nutrition (scaled to your servings)">
                  {nutrition ? (
                    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        ['Calories', Math.round(nutrition.calories ?? 0), ''],
                        ['Protein',  Math.round(nutrition.protein  ?? 0), 'g'],
                        ['Fat',      Math.round(nutrition.fat      ?? 0), 'g'],
                        ['Carbs',    Math.round(nutrition.carbs    ?? 0), 'g'],
                      ].map(([label, val, unit]) => (
                        <div key={label} className="rounded-xl border-2 border-olive/25 bg-cream px-3 py-2">
                          <dt className="text-xs font-bold uppercase tracking-wide text-bark-light/60">{label}</dt>
                          <dd className="text-lg font-black text-bark">{val}{unit}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-bark-light/60">No nutrition data.</p>
                  )}
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
