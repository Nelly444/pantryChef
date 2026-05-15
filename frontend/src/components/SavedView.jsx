import { useState } from 'react'
import EmptyState from './EmptyState.jsx'
import RecipeCard from './RecipeCard.jsx'
import { Bowl, X } from './Icons.jsx'
import { DAYS, DAY_SHORT, MEAL_TYPES } from '../hooks/useMealPlan.js'

function AddToPlanModal({ recipe, onConfirm, onClose }) {
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedMeal, setSelectedMeal] = useState(null)

  const canConfirm = selectedDay && selectedMeal

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bark/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-olive/20 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-olive/15 px-5 py-4">
          <div className="min-w-0 pr-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-forest/60">Add to Meal Plan</p>
            <p className="mt-0.5 truncate text-sm font-bold text-bark">{recipe.title}</p>
          </div>
          <button type="button" onClick={onClose}
            className="mt-0.5 shrink-0 rounded-full p-1 text-bark-light/40 transition hover:bg-olive-light hover:text-bark">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-bark-light/50">Day</p>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((day, i) => (
                <button key={day} type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`rounded-lg py-2 text-[10px] font-bold transition ${
                    selectedDay === day
                      ? 'bg-forest text-white shadow-sm'
                      : 'bg-olive-light/60 text-bark-light hover:bg-olive-light'
                  }`}>
                  {DAY_SHORT[i]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-bark-light/50">Meal</p>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map(meal => (
                <button key={meal} type="button"
                  onClick={() => setSelectedMeal(meal)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    selectedMeal === meal
                      ? 'border-forest bg-forest text-white shadow-sm'
                      : 'border-olive/30 bg-white text-bark-light/60 hover:border-forest/40 hover:text-bark'
                  }`}>
                  {meal}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-olive/15 px-5 py-4">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-olive/30 py-2.5 text-sm font-bold text-bark-light/60 transition hover:bg-olive-light">
            Cancel
          </button>
          <button type="button"
            disabled={!canConfirm}
            onClick={() => { onConfirm(selectedDay, selectedMeal); onClose() }}
            className="flex-1 rounded-xl bg-forest py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-40">
            Add to Plan
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SavedView({ favs, isFav, onToggleFav, onSelect, onNavigateHome, onAddToPlan, onClearAll }) {
  const [addingRecipe, setAddingRecipe] = useState(null)
  const [toast, setToast] = useState('')

  function handleConfirm(day, mealType) {
    onAddToPlan(addingRecipe, day, mealType)
    setToast(`Added to ${day} ${mealType}`)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-black italic text-bark">Saved Recipes</h2>
          <p className="text-sm text-bark-light/60">
            {favs.length} recipe{favs.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        {favs.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100">
            Clear all
          </button>
        )}
      </div>

      {toast && (
        <div className="mb-4 rounded-2xl border border-forest/20 bg-forest/10 px-4 py-3 text-sm font-semibold text-forest">
          {toast}
        </div>
      )}

      {favs.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favs.map(fav => (
            <div key={fav.id} className="flex flex-col gap-2">
              <RecipeCard
                result={{
                  recipe: fav,
                  match_percentage: fav.match_percentage ?? 0,
                  missing_ingredients: fav.missing_ingredients ?? null,
                  nutrition: fav.nutrition ?? null,
                }}
                isFav={isFav(fav.id)}
                onToggleFav={onToggleFav}
                onSelect={onSelect}
              />
              <button
                type="button"
                onClick={() => setAddingRecipe(fav)}
                className="w-full rounded-xl border border-forest/30 bg-white py-2 text-xs font-bold text-forest transition hover:bg-forest hover:text-white">
                + Add to Meal Plan
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          Icon={Bowl}
          title="No saved recipes yet."
          message="Click the heart icon on any recipe card to save it here."
          action="Find recipes"
          onAction={onNavigateHome}
        />
      )}

      {addingRecipe && (
        <AddToPlanModal
          recipe={addingRecipe}
          onConfirm={handleConfirm}
          onClose={() => setAddingRecipe(null)}
        />
      )}
    </div>
  )
}
