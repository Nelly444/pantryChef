import { useState } from 'react'
import EmptyState from './EmptyState.jsx'
import { Leaf } from './Icons.jsx'

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - Date.now()) / 86_400_000)
}

function ExpiryBadge({ days }) {
  if (days === null) return null
  if (days < 0) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">Expired</span>
  if (days <= 3) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">Exp. in {days}d</span>
  if (days <= 7) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Exp. in {days}d</span>
  return <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Good</span>
}

function IngredientCard({ item, expDate, onRemove, onSetExpiry }) {
  const [editing, setEditing] = useState(false)
  const days = daysUntil(expDate)

  const borderColor =
    days === null ? 'border-olive/20' :
    days <= 3     ? 'border-red-200' :
    days <= 7     ? 'border-amber-200' :
                    'border-green-200'

  return (
    <div className={`flex items-start gap-3 rounded-2xl border ${borderColor} bg-white p-4 shadow-sm transition`}>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest/10 text-forest">
        <Leaf size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold capitalize text-bark truncate">{item}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {expDate
            ? <ExpiryBadge days={days} />
            : <span className="text-xs text-bark-light/40">No expiry set</span>
          }
        </div>
        {editing ? (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="date"
              defaultValue={expDate || ''}
              className="rounded-lg border border-olive/30 px-2 py-1 text-xs outline-none focus-visible:border-forest"
              onChange={e => onSetExpiry(item, e.target.value || null)}
            />
            <button type="button" onClick={() => setEditing(false)}
              className="text-xs font-bold text-bark-light/50 hover:text-bark">Done</button>
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)}
            className="mt-1.5 text-[10px] font-semibold text-forest/60 hover:text-forest transition">
            {expDate ? 'Edit expiry' : '+ Set expiry'}
          </button>
        )}
      </div>
      <button type="button" onClick={() => onRemove(item)}
        className="shrink-0 rounded-lg p-1.5 text-bark-light/40 transition hover:bg-red-50 hover:text-red-500"
        aria-label={`Remove ${item}`}>×</button>
    </div>
  )
}

export default function PantryView({ ingredientsList, expirations, onRemove, onClear, onSetExpiry, onNavigateHome }) {
  const useSoon = ingredientsList.filter(item => {
    const d = daysUntil(expirations[item.toLowerCase()])
    return d !== null && d <= 7
  }).sort((a, b) => {
    return (daysUntil(expirations[a.toLowerCase()]) ?? 999) - (daysUntil(expirations[b.toLowerCase()]) ?? 999)
  })

  const rest = ingredientsList.filter(item => !useSoon.includes(item))

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
        <div className="space-y-6">
          {useSoon.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-red-500/70">Use Soon</p>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {useSoon.map(item => (
                  <IngredientCard key={item} item={item}
                    expDate={expirations[item.toLowerCase()] ?? null}
                    onRemove={onRemove}
                    onSetExpiry={onSetExpiry} />
                ))}
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              {useSoon.length > 0 && <p className="mb-3 text-xs font-black uppercase tracking-widest text-bark-light/40">All items</p>}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {rest.map(item => (
                  <IngredientCard key={item} item={item}
                    expDate={expirations[item.toLowerCase()] ?? null}
                    onRemove={onRemove}
                    onSetExpiry={onSetExpiry} />
                ))}
              </div>
            </div>
          )}
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
