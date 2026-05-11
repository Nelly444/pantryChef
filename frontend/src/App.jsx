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
  const [history, setHistory] = useState([]) // [{result, ingredients, timestamp}]

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
      setHistory(prev => [
        { result: data, ingredients: [...ingredientsList], timestamp: new Date() },
        ...prev.slice(0, 4), // keep last 5
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
    if (key === 'matching') scrollToId('matching')
  }

  const recipe = result?.recipe
  const summaryFull = stripHtml(recipe?.summary)
  const summaryPlain = summaryFull.slice(0, 720)
  const nutrition = result?.nutrition

  return (
    <div id="top" className="flex min-h-screen flex-col bg-green-50">
      <TopProgress active={loading} />
      <Header onNavigate={handleNavigate} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-green-950 sm:text-4xl">
            Cook from what you already have
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-green-800/70">
            Add your pantry items → get one great recipe match, see what's missing, and check nutrition scaled to your servings.
          </p>
        </section>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left: Pantry form */}
          <div id="cook" className="lg:col-span-5">
            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-green-950">Your Pantry</h2>
                  <p className="mt-1 text-sm text-green-700/70">What you have right now.</p>
                </div>
                <div className="flex items-center gap-2">
                  {ingredientsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIngredientsList([])}
                      className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                    >
                      Clear all
                    </button>
                  )}
                  <details className="relative">
                    <summary className="cursor-pointer list-none rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-800 marker:hidden outline-none hover:bg-green-100 focus-visible:ring-2 focus-visible:ring-green-400 [&::-webkit-details-marker]:hidden">
                      Quick add
                    </summary>
                    <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-green-200 bg-white py-1 shadow-xl">
                      {STAPLES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="block w-full px-4 py-2.5 text-left text-sm text-green-950 hover:bg-green-50"
                          onClick={() => addIngredient(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="ingredient" className="sr-only">Ingredient name</label>
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
                    className="w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none placeholder:text-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="inline-flex items-center justify-center rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 active:translate-y-px sm:w-28"
                  >
                    Add
                  </button>
                </div>
                {inputHint ? <p className="mt-2 text-sm text-amber-700">{inputHint}</p> : null}
              </div>

              {ingredientsList.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2" aria-label="Pantry items">
                  {ingredientsList.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-3 py-1 text-sm font-medium text-green-900"
                    >
                      {item}
                      <button
                        type="button"
                        className="ml-1 grid h-5 w-5 place-items-center rounded-full text-green-600 hover:bg-green-200 hover:text-green-900"
                        onClick={() => setIngredientsList((prev) => prev.filter((x) => x !== item))}
                        aria-label={`Remove ${item}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-xl border border-dashed border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                  Type an ingredient and press Enter, or use Quick add.
                </p>
              )}

              <form className="mt-7 space-y-4 border-t border-green-100 pt-6" onSubmit={handleSuggest}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="servings" className="block text-xs font-semibold uppercase tracking-wide text-green-700">
                      Servings
                    </label>
                    <input
                      id="servings"
                      type="number"
                      min={1}
                      value={serving}
                      onChange={(e) => setServing(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-green-200 bg-white px-3 py-2.5 text-sm text-green-950 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="meal" className="block text-xs font-semibold uppercase tracking-wide text-green-700">
                      Meal focus
                    </label>
                    <select
                      id="meal"
                      value={meal}
                      onChange={(e) => setMeal(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-green-200 bg-white px-3 py-2.5 text-sm text-green-950 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
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
                  <label htmlFor="dietary" className="block text-xs font-semibold uppercase tracking-wide text-green-700">
                    Dietary notes
                  </label>
                  <input
                    id="dietary"
                    type="text"
                    placeholder="e.g. vegetarian, gluten free"
                    value={dietaryText}
                    onChange={(e) => setDietaryText(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-green-200 bg-white px-3 py-2.5 text-sm text-green-950 outline-none placeholder:text-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                  />
                  <p className="mt-1 text-xs text-green-500">Separate multiple restrictions with commas.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-green-700 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Finding your best match…' : 'Suggest recipe'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Results */}
          <div id="result" className="lg:col-span-7">
            {/* Recent history strip */}
            {history.length > 1 && (
              <div className="mb-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700">Recent searches</p>
                <div className="flex flex-wrap gap-2">
                  {history.slice(1).map((h, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setResult(h.result)
                        setIngredientsList(h.ingredients)
                        requestAnimationFrame(() => scrollToId('result'))
                      }}
                      className="flex items-center gap-1.5 rounded-full border border-green-200 bg-white px-3 py-1.5 text-xs font-medium text-green-800 shadow-sm hover:bg-green-50 transition"
                    >
                      <span className="text-green-400">🍽</span>
                      {h.result?.recipe?.title?.slice(0, 28) ?? 'Recipe'}
                      {h.result?.recipe?.title?.length > 28 ? '…' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm"
              >
                <p className="font-semibold">Could not complete that request</p>
                <p className="mt-2 leading-relaxed">{error}</p>
                <button
                  type="button"
                  className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50"
                  onClick={() => setError('')}
                >
                  Dismiss
                </button>
              </div>
            ) : null}

            {!result && !error ? (
              <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-green-100">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-green-600">
                    <path d="M4 10h16M7 6h10M6 14h12M9 18h6" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="font-semibold text-green-950">Your recipe card will appear here</p>
                <p className="mt-2 text-sm text-green-700/70">Add pantry items and click <span className="font-semibold text-green-800">Suggest recipe</span>.</p>
              </div>
            ) : null}

            {result && recipe ? (
              <div className="space-y-5">
                <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-md">
                  <div className="grid gap-0 md:grid-cols-5">
                    <div className="relative md:col-span-2">
                      {recipe.image ? (
                        <img
                          src={recipe.image}
                          alt={recipe.title ? `${recipe.title} photo` : 'Recipe photo'}
                          className="h-48 w-full object-cover md:h-full md:min-h-[220px]"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-green-100 text-sm font-medium text-green-600 md:h-full">
                          No image
                        </div>
                      )}
                      <div className="absolute left-3 top-3 rounded-full border border-white/60 bg-green-800/90 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                        {result.match_percentage}% pantry match
                      </div>
                    </div>

                    <div className="p-5 md:col-span-3">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-2xl font-bold tracking-tight text-green-950">{recipe.title}</h2>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="shrink-0 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
                          title="Print recipe"
                        >
                          🖨 Print
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        {typeof recipe.readyInMinutes === 'number' ? (
                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-green-800">
                            {recipe.readyInMinutes} min
                          </span>
                        ) : null}
                        {typeof recipe.servings === 'number' ? (
                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-green-800">
                            Serves {recipe.servings}
                          </span>
                        ) : null}
                        {recipe.vegetarian ? (
                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-green-800">Vegetarian</span>
                        ) : null}
                        {recipe.vegan ? (
                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-green-800">Vegan</span>
                        ) : null}
                      </div>

                      {nutrition ? (
                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {[
                            ['Calories', Math.round(nutrition.calories ?? 0)],
                            ['Protein', `${Math.round(nutrition.protein ?? 0)}g`],
                            ['Fat', `${Math.round(nutrition.fat ?? 0)}g`],
                            ['Carbs', `${Math.round(nutrition.carbs ?? 0)}g`],
                          ].map(([label, val]) => (
                            <div key={label} className="rounded-xl border border-green-100 bg-green-50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-green-600">{label}</p>
                              <p className="mt-1 text-lg font-bold text-green-950">{val}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {recipe.sourceUrl ? (
                        <a
                          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 underline underline-offset-4 hover:text-green-900"
                          href={recipe.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View original recipe ↗
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Accordion title="Missing ingredients" defaultOpen>
                    {result.missing_ingredients?.length ? (
                      <ul className="list-disc space-y-2 pl-5">
                        {result.missing_ingredients.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-green-700/70">You have everything for this recipe!</p>
                    )}
                  </Accordion>

                  <Accordion title="Recipe details">
                    {summaryPlain ? (
                      <div className="space-y-3 leading-relaxed text-gray-700">
                        {(() => {
                          // Split on sentence-ending punctuation followed by a space+capital, preserving the punctuation
                          const sentences = summaryPlain.match(/[^.!?]+[.!?]+(\s|$)/g) || [summaryPlain]
                          const cleaned = sentences.map(s => s.trim()).filter(Boolean)
                          // Group into paragraphs of 3 sentences
                          const paras = []
                          for (let i = 0; i < cleaned.length; i += 3) {
                            paras.push(cleaned.slice(i, i + 3).join(' '))
                          }
                          return paras.map((p, i) => <p key={i}>{p}</p>)
                        })()}
                      </div>
                    ) : (
                      <p className="text-green-700/70">No summary available for this recipe.</p>
                    )}
                  </Accordion>

                  <Accordion title="Full ingredient list">
                    {Array.isArray(recipe.extendedIngredients) && recipe.extendedIngredients.length > 0 ? (
                      <ul className="space-y-2">
                        {recipe.extendedIngredients.map((ing) => (
                          <li key={ing.id ?? ing.original} className="flex gap-2 border-b border-green-100 py-2 last:border-0">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-400" aria-hidden />
                            <span>{ing.original || ing.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-green-700/70">Ingredient list unavailable.</p>
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
                          <div key={label} className="rounded-lg bg-green-50 px-3 py-2">
                            <dt className="text-xs font-semibold text-green-600">{label}</dt>
                            <dd className="text-base font-bold text-green-950">{val}{unit}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </Accordion>

                  <div id="matching">
                    <Accordion title="How matching works">
                      <p className="text-green-800/75">Match % is based on how many of the recipe's ingredients you already have vs. what's missing — not flavor compatibility.</p>
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