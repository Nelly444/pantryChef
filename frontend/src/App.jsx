import { useCallback, useEffect, useMemo, useState } from 'react'
import CookingMode from './components/CookingMode.jsx'
import EmptyState from './components/EmptyState.jsx'
import FilterBar from './components/FilterBar.jsx'
import Footer from './components/Footer.jsx'
import GroceryListView from './components/GroceryListView.jsx'
import HeroSection from './components/HeroSection.jsx'
import MealPlanView from './components/MealPlanView.jsx'
import NavBar from './components/NavBar.jsx'
import PantryView from './components/PantryView.jsx'
import RecipeCard from './components/RecipeCard.jsx'
import RecipeDetailModal from './components/RecipeDetailModal.jsx'
import SavedView from './components/SavedView.jsx'
import SidePanel from './components/SidePanel.jsx'
import SkeletonCard from './components/SkeletonCard.jsx'
import StatCards from './components/StatCards.jsx'
import TopProgress from './components/TopProgress.jsx'
import { Bowl, Leaf, Search, Sprout } from './components/Icons.jsx'
import { suggestRecipes } from './lib/api.js'
import { useFavorites } from './hooks/useFavorites.js'

const EXP_KEY = 'pantry-expirations'

function loadExpirations() {
  try { return JSON.parse(localStorage.getItem(EXP_KEY) || '{}') }
  catch { return {} }
}

export default function App() {
  const [view, setView]                       = useState('home')
  const [ingredientsList, setIngredientsList] = useState([])
  const [serving, setServing]                 = useState(2)
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')
  const [results, setResults]                 = useState([])
  const [activeFilter, setActiveFilter]       = useState('all')
  const [selectedResult, setSelectedResult]   = useState(null)
  const [cookingSteps, setCookingSteps]       = useState([])
  const [expirations, setExpirations]         = useState(loadExpirations)
  const { favs, toggle: toggleFav, isFav }    = useFavorites()

  useEffect(() => {
    localStorage.setItem(EXP_KEY, JSON.stringify(expirations))
  }, [expirations])

  const navigate = (target) => { setView(target); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const addIngredient = useCallback((raw) => {
    const next = raw.trim()
    if (ingredientsList.some(x => x.toLowerCase() === next.toLowerCase())) return false
    setIngredientsList(prev => [...prev, next])
    return true
  }, [ingredientsList])

  const removeIngredient = useCallback((item) => {
    setIngredientsList(prev => prev.filter(x => x !== item))
    setExpirations(prev => {
      const next = { ...prev }
      delete next[item.toLowerCase()]
      return next
    })
  }, [])

  const setExpiry = useCallback((item, date) => {
    setExpirations(prev => {
      if (!date) {
        const next = { ...prev }
        delete next[item.toLowerCase()]
        return next
      }
      return { ...prev, [item.toLowerCase()]: date }
    })
  }, [])

  const handleSearch = useCallback(async ({ meal, dietary }) => {
    setError('')
    setResults([])
    setActiveFilter('all')
    setLoading(true)
    try {
      const data = await suggestRecipes({
        ingredients: ingredientsList,
        serving: Math.max(1, Math.min(20, serving)),
        meal,
        dietary_restrictions: dietary,
        expirations: Object.keys(expirations).length ? expirations : undefined,
      })
      setResults(data.results ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [ingredientsList, serving])

  const bestMatch   = results.length ? Math.max(...results.map(r => r.match_percentage)) : 0
  const avgCalories = useMemo(() => {
    const withCal = results.filter(r => r.nutrition?.calories > 0)
    return withCal.length ? withCal.reduce((s, r) => s + r.nutrition.calories, 0) / withCal.length : 0
  }, [results])

  const filteredResults = useMemo(() => {
    const fn = {
      'high-match':  r => r.match_percentage >= 80,
      'quick':       r => (r.recipe.readyInMinutes ?? 999) <= 30,
      'vegetarian':  r => r.recipe.vegetarian,
      '1-missing':   r => r.missing_ingredients.length <= 1,
    }[activeFilter]
    return fn ? results.filter(fn) : results
  }, [results, activeFilter])

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <TopProgress active={loading} />

      <NavBar view={view} onNavigate={navigate} ingredientCount={ingredientsList.length} savedCount={favs.length} />

      <main className="flex-1">

        {view === 'home' && (
          <div className="view-enter">
            <HeroSection
              ingredientsList={ingredientsList}
              onAdd={addIngredient}
              onRemove={removeIngredient}
              onClear={() => setIngredientsList([])}
              serving={serving}
              setServing={setServing}
              onSearch={handleSearch}
              loading={loading}
            />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

              {error && (
                <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <p className="font-bold">Something went wrong</p>
                  <p className="mt-1">{error}</p>
                  <button type="button" onClick={() => setError('')}
                    className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50">
                    Dismiss
                  </button>
                </div>
              )}

              {loading && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[0,1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
                  </div>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="space-y-6">
                  <StatCards ingredientCount={ingredientsList.length} recipeCount={results.length} bestMatch={bestMatch} avgCalories={avgCalories} />

                  <div className="rounded-2xl border border-olive/20 bg-white p-3">
                    <FilterBar active={activeFilter} onChange={setActiveFilter} results={results} />
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="flex-1 min-w-0">
                      <p className="mb-4 text-xs font-black uppercase tracking-widest text-bark-light/50">
                        {filteredResults.length} recipe{filteredResults.length !== 1 ? 's' : ''} found
                      </p>
                      {filteredResults.length > 0 ? (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          {filteredResults.map(result => (
                            <RecipeCard key={result.recipe.id} result={result}
                              isFav={isFav(result.recipe.id)}
                              onToggleFav={toggleFav}
                              onSelect={setSelectedResult} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState Icon={Bowl} title="No recipes match this filter."
                          message="Try a different filter or add more ingredients."
                          action="Show all" onAction={() => setActiveFilter('all')} />
                      )}
                    </div>
                    <div className="hidden w-64 shrink-0 lg:block">
                      <div className="sticky top-24">
                        <SidePanel results={results} ingredientsList={ingredientsList} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!loading && results.length === 0 && !error && (
                <div className="space-y-8">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { Icon: Leaf,   step: '01', title: 'Add what you have',   desc: 'Type any ingredient from your fridge, pantry, or freezer.' },
                      { Icon: Search, step: '02', title: 'We rank the matches',  desc: 'Our algorithm scores thousands of recipes by how much you already have.' },
                      { Icon: Sprout, step: '03', title: 'Cook with confidence', desc: 'Step-by-step mode, nutrition facts, and one-tap saving.' },
                    ].map(({ Icon, step, title, desc }) => (
                      <div key={step} className="rounded-2xl border border-olive/20 bg-white/70 p-5">
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-forest/10 text-forest">
                          <Icon size={18} />
                        </div>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-forest/60">{step}</p>
                        <h3 className="font-display mb-1 text-base font-bold text-bark">{title}</h3>
                        <p className="text-sm leading-relaxed text-bark-light/60">{desc}</p>
                      </div>
                    ))}
                  </div>
                  <EmptyState Icon={Bowl} title="Your recipes will appear here."
                    message="Add ingredients above and click Find Recipes to get started." />
                </div>
              )}

            </div>
          </div>
        )}

        {view === 'pantry' && (
          <div className="view-enter"><PantryView
            ingredientsList={ingredientsList}
            expirations={expirations}
            onRemove={removeIngredient}
            onClear={() => setIngredientsList([])}
            onSetExpiry={setExpiry}
            onNavigateHome={() => navigate('home')}
          /></div>
        )}

        {view === 'saved' && (
          <div className="view-enter">
            <SavedView favs={favs} isFav={isFav} onToggleFav={toggleFav}
              onSelect={setSelectedResult} onNavigateHome={() => navigate('home')} />
          </div>
        )}

        {view === 'plan' && (
          <div className="view-enter">
            <MealPlanView results={results} favs={favs} expirations={expirations} />
          </div>
        )}

        {view === 'grocery' && (
          <div className="view-enter">
            <GroceryListView onNavigateHome={() => navigate('home')} />
          </div>
        )}

      </main>

      {selectedResult && (
        <RecipeDetailModal result={selectedResult} serving={serving}
          isFav={isFav(selectedResult.recipe.id)} onToggleFav={toggleFav}
          onClose={() => setSelectedResult(null)}
          onStartCooking={steps => { setSelectedResult(null); setCookingSteps(steps) }} />
      )}

      {cookingSteps.length > 0 && (
        <CookingMode steps={cookingSteps} onClose={() => setCookingSteps([])} />
      )}

      <Footer />
    </div>
  )
}
