import { useCallback, useState } from 'react'
import Accordion from './components/Accordion.jsx'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import TopProgress from './components/TopProgress.jsx'
import { suggestRecipe } from './lib/api.js'
import { stripHtml } from './lib/text.js'

const STAPLES = ['eggs', 'onion', 'garlic', 'rice', 'chicken breast', 'tomato', 'olive oil', 'pasta']

function scrollToId(id) {
  const el = document.getElementById(id)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

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

  const addIngredient = useCallback(
    (raw) => {
      const next = raw.trim()
      if (!next) {
        setInputHint('Enter an ingredient.')
        return
      }
      const lower = next.toLowerCase()
      if (ingredientsList.some((x) => x.toLowerCase() === lower)) {
        setInputHint('Already in list.')
        return
      }
      setIngredientsList((prev) => [...prev, next])
      setIngredient('')
      setInputHint('')
    },
    [ingredientsList],
  )

  const handleAddIngredient = () => addIngredient(ingredient)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddIngredient()
    }
  }

  const parseDietary = () => {
    const parts = dietaryText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return parts.length ? parts : null
  }

  const handleSuggest = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    if (ingredientsList.length === 0) {
      setError('Add at least one ingredient.')
      scrollToId('cook')
      return
    }
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
    if (key === 'matching') scrollToId('matching')
    if (key === 'api') scrollToId('api')
  }

  const recipe = result?.recipe
  const summaryFull = stripHtml(recipe?.summary)
  const summaryPlain = summaryFull.slice(0, 720)
  const nutrition = result?.nutrition

  return (
    <div id="top" className="flex min-h-screen flex-col">
      <TopProgress active={loading} />
      <Header onNavigate={handleNavigate} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">Cook from what you already have</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-emerald-900/70">
            Pantry in → one match, nutrition for your servings, gaps listed.
          </p>
        </section>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div id="cook" className="lg:col-span-5">
            <div className="rounded-2xl border border-emerald-200/90 bg-white/85 p-5 shadow-sm ring-1 ring-emerald-950/[0.04] backdrop-blur-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-950">Pantry</h2>
                  <p className="mt-1 text-sm text-emerald-900/65">What you have now.</p>
                </div>
                <details className="relative">
                  <summary className="cursor-pointer list-none rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 marker:hidden outline-none ring-emerald-500/30 focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
                    Quick add
                  </summary>
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-emerald-200 bg-white py-1 shadow-xl ring-1 ring-emerald-950/10">
                    {STAPLES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="block w-full px-4 py-2.5 text-left text-sm text-emerald-950 hover:bg-emerald-50"
                        onClick={() => addIngredient(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </details>
              </div>

              <div className="mt-5">
                <label htmlFor="ingredient" className="sr-only">
                  Ingredient name
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    id="ingredient"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. Greek yogurt"
                    value={ingredient}
                    onChange={(e) => {
                      setIngredient(e.target.value)
                      if (inputHint) setInputHint('')
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full rounded-xl border border-emerald-200/90 bg-white px-4 py-3 text-sm text-emerald-950 shadow-inner shadow-emerald-950/5 outline-none ring-emerald-500/30 placeholder:text-emerald-900/35 focus:border-emerald-300 focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-950/10 outline-none ring-emerald-500/30 transition hover:bg-emerald-900 focus-visible:ring-2 active:translate-y-px sm:w-36"
                  >
                    Add
                  </button>
                </div>
                {inputHint ? <p className="mt-2 text-sm text-amber-800">{inputHint}</p> : null}
              </div>

              {ingredientsList.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2" aria-label="Pantry items">
                  {ingredientsList.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-100/70 px-3 py-1 text-sm font-medium text-emerald-950"
                    >
                      {item}
                      <button
                        type="button"
                        className="ml-1 grid h-6 w-6 place-items-center rounded-full text-emerald-800/80 outline-none ring-emerald-500/30 hover:bg-white/60 hover:text-emerald-950 focus-visible:ring-2"
                        onClick={() => setIngredientsList((prev) => prev.filter((x) => x !== item))}
                        aria-label={`Remove ${item}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-xl border border-dashed border-emerald-200/90 bg-emerald-50/40 px-4 py-3 text-sm text-emerald-900/65">
                  Type or Enter to add, or Quick add.
                </p>
              )}

              <form className="mt-7 space-y-4 border-t border-emerald-100 pt-6" onSubmit={handleSuggest}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="servings" className="block text-xs font-semibold uppercase tracking-wide text-emerald-900/55">
                      Servings
                    </label>
                    <input
                      id="servings"
                      type="number"
                      min={1}
                      value={serving}
                      onChange={(e) => setServing(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-emerald-200/90 bg-white px-3 py-2.5 text-sm text-emerald-950 outline-none ring-emerald-500/30 focus:border-emerald-300 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="meal" className="block text-xs font-semibold uppercase tracking-wide text-emerald-900/55">
                      Meal focus
                    </label>
                    <select
                      id="meal"
                      value={meal}
                      onChange={(e) => setMeal(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-emerald-200/90 bg-white px-3 py-2.5 text-sm text-emerald-950 outline-none ring-emerald-500/30 focus:border-emerald-300 focus:ring-2"
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
                  <label htmlFor="dietary" className="block text-xs font-semibold uppercase tracking-wide text-emerald-900/55">
                    Dietary notes
                  </label>
                  <input
                    id="dietary"
                    type="text"
                    placeholder="e.g. vegetarian, gluten free"
                    value={dietaryText}
                    onChange={(e) => setDietaryText(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-emerald-200/90 bg-white px-3 py-2.5 text-sm text-emerald-950 outline-none ring-emerald-500/30 placeholder:text-emerald-900/35 focus:border-emerald-300 focus:ring-2"
                  />
                  <p className="mt-1 text-xs text-emerald-900/50">Comma-separated → API list.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-800 px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-emerald-950/15 outline-none ring-emerald-500/30 transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2"
                >
                  {loading ? 'Finding your best match…' : 'Suggest recipe'}
                </button>
              </form>
            </div>
          </div>

          <div id="result" className="lg:col-span-7">
            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50/80 p-5 text-sm text-red-900 shadow-sm ring-1 ring-red-950/10"
              >
                <p className="font-semibold">We could not complete that request</p>
                <p className="mt-2 leading-relaxed">{error}</p>
                <button
                  type="button"
                  className="mt-4 rounded-xl border border-red-300/80 bg-white px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-50"
                  onClick={() => setError('')}
                >
                  Dismiss
                </button>
              </div>
            ) : null}

            {!result && !error ? (
              <div className="rounded-2xl border border-emerald-200/90 bg-white/70 p-6 text-sm leading-relaxed text-emerald-900/70 shadow-sm ring-1 ring-emerald-950/[0.03] backdrop-blur-sm">
                <p className="font-semibold text-emerald-950">Your recipe card will appear here</p>
                <p className="mt-2">Add items → <span className="font-semibold text-emerald-900">Suggest recipe</span>.</p>
              </div>
            ) : null}

            {result && recipe ? (
              <div className="space-y-5">
                <div className="overflow-hidden rounded-2xl border border-emerald-200/90 bg-white shadow-md ring-1 ring-emerald-950/[0.04]">
                  <div className="grid gap-0 md:grid-cols-5">
                    <div className="relative md:col-span-2">
                      {recipe.image ? (
                        <img
                          src={recipe.image}
                          alt={recipe.title ? `${recipe.title} photo` : 'Recipe photo'}
                          className="h-48 w-full object-cover md:h-full md:min-h-[220px]"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-emerald-100/60 text-sm font-medium text-emerald-900/60 md:h-full">
                          No image
                        </div>
                      )}
                      <div className="absolute left-3 top-3 rounded-full border border-white/40 bg-emerald-950/85 px-3 py-1 text-xs font-semibold text-emerald-50 shadow-sm backdrop-blur">
                        {result.match_percentage}% pantry match
                      </div>
                    </div>

                    <div className="p-5 md:col-span-3">
                      <h2 className="text-2xl font-bold tracking-tight text-emerald-950">{recipe.title}</h2>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900/70">
                        {typeof recipe.readyInMinutes === 'number' ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-900">
                            {recipe.readyInMinutes} min
                          </span>
                        ) : null}
                        {typeof recipe.servings === 'number' ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-900">
                            Base servings: {recipe.servings}
                          </span>
                        ) : null}
                        {recipe.vegetarian ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-900">
                            Vegetarian
                          </span>
                        ) : null}
                        {recipe.vegan ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-900">Vegan</span>
                        ) : null}
                      </div>

                      {nutrition ? (
                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {[
                            ['Calories', Math.round(nutrition.calories ?? 0)],
                            ['Protein (g)', Math.round(nutrition.protein ?? 0)],
                            ['Fat (g)', Math.round(nutrition.fat ?? 0)],
                            ['Carbs (g)', Math.round(nutrition.carbs ?? 0)],
                          ].map(([label, val]) => (
                            <div key={label} className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-900/55">{label}</p>
                              <p className="mt-1 text-lg font-bold text-emerald-950">{val}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {recipe.sourceUrl ? (
                        <a
                          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline decoration-emerald-300/80 underline-offset-4 hover:text-emerald-950"
                          href={recipe.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View original source
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Accordion title="Missing ingredients & quick shop list" defaultOpen>
                    {result.missing_ingredients?.length ? (
                      <ul className="list-disc space-y-2 pl-5">
                        {result.missing_ingredients.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-emerald-900/70">Looks complete vs your list.</p>
                    )}
                  </Accordion>

                  <Accordion title="Recipe details">
                    {summaryPlain ? (
                      <p className="whitespace-pre-wrap">
                        {summaryPlain}
                        {summaryFull.length > 720 ? '…' : ''}
                      </p>
                    ) : (
                      <p className="text-emerald-900/70">No summary was provided for this recipe.</p>
                    )}
                  </Accordion>

                  <Accordion title="Full ingredient list">
                    {Array.isArray(recipe.extendedIngredients) && recipe.extendedIngredients.length > 0 ? (
                      <ul className="space-y-2">
                        {recipe.extendedIngredients.map((ing) => (
                          <li key={ing.id ?? ing.original} className="flex gap-2 border-b border-emerald-100/80 py-2 last:border-0">
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400/90" aria-hidden />
                            <span>{ing.original || ing.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-emerald-900/70">Ingredient list unavailable.</p>
                    )}
                  </Accordion>

                  <Accordion title="Nutrition (scaled)">
                    <p className="text-emerald-900/75">Numbers use your servings × API scaling.</p>
                    {nutrition ? (
                      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg bg-emerald-50/60 px-3 py-2">
                          <dt className="text-xs font-semibold text-emerald-900/55">Calories</dt>
                          <dd className="text-base font-bold text-emerald-950">{Math.round(nutrition.calories ?? 0)}</dd>
                        </div>
                        <div className="rounded-lg bg-emerald-50/60 px-3 py-2">
                          <dt className="text-xs font-semibold text-emerald-900/55">Protein</dt>
                          <dd className="text-base font-bold text-emerald-950">{Math.round(nutrition.protein ?? 0)} g</dd>
                        </div>
                        <div className="rounded-lg bg-emerald-50/60 px-3 py-2">
                          <dt className="text-xs font-semibold text-emerald-900/55">Fat</dt>
                          <dd className="text-base font-bold text-emerald-950">{Math.round(nutrition.fat ?? 0)} g</dd>
                        </div>
                        <div className="rounded-lg bg-emerald-50/60 px-3 py-2">
                          <dt className="text-xs font-semibold text-emerald-900/55">Carbs</dt>
                          <dd className="text-base font-bold text-emerald-950">{Math.round(nutrition.carbs ?? 0)} g</dd>
                        </div>
                      </dl>
                    ) : null}
                  </Accordion>

                  <div id="matching">
                    <Accordion title="How matching works">
                      <p className="text-emerald-900/75">% = used vs missed ingredients in Spoonacular results, not taste.</p>
                    </Accordion>
                  </div>

                  <div id="api">
                    <Accordion title="API & local development">
                      <p className="text-emerald-900/75">
                        <span className="font-mono text-xs font-semibold text-emerald-950">POST /recipes/suggest</span>
                        {' · '}
                        dev: Vite proxies <span className="font-mono text-xs font-semibold text-emerald-950">/recipes</span> →{' '}
                        <span className="font-mono text-xs font-semibold text-emerald-950">127.0.0.1:8000</span>
                      </p>
                      <a
                        className="mt-4 inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-100"
                        href={`${(import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}/docs`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Swagger docs
                      </a>
                    </Accordion>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
