import EmptyState from './EmptyState.jsx'
import { Leaf } from './Icons.jsx'

export default function PantryView({ ingredientsList, onRemove, onClear, onNavigateHome }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-black italic text-bark">Your Pantry</h2>
          <p className="text-sm text-bark-light/60">
            {ingredientsList.length} ingredient{ingredientsList.length !== 1 ? 's' : ''} added
          </p>
        </div>
        {ingredientsList.length > 0 && (
          <button type="button" onClick={onClear}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100">
            Clear pantry
          </button>
        )}
      </div>

      {ingredientsList.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {ingredientsList.map(item => (
            <div key={item} className="flex items-center justify-between gap-3 rounded-2xl border border-olive/20 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest/10 text-forest">
                  <Leaf size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold capitalize text-bark">{item}</p>
                  <p className="text-xs text-bark-light/50">In pantry</p>
                </div>
              </div>
              <button type="button" onClick={() => onRemove(item)}
                className="shrink-0 rounded-lg p-1.5 text-bark-light/40 transition hover:bg-red-50 hover:text-red-500"
                aria-label={`Remove ${item}`}>×</button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          Icon={Leaf}
          title="Your pantry is empty."
          message="Head back to Home and start adding ingredients."
          action="Go to Home"
          onAction={onNavigateHome}
        />
      )}
    </div>
  )
}
