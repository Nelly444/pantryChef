import EmptyState from './EmptyState.jsx'
import RecipeCard from './RecipeCard.jsx'
import { Bowl } from './Icons.jsx'

export default function SavedView({ favs, isFav, onToggleFav, onSelect, onNavigateHome }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-black italic text-bark">Saved Recipes</h2>
        <p className="text-sm text-bark-light/60">
          {favs.length} recipe{favs.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {favs.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favs.map(fav => (
            <RecipeCard
              key={fav.id}
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
    </div>
  )
}
