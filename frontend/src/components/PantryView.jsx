import { useState } from 'react'
import EmptyState from './EmptyState.jsx'
import { Leaf, X } from './Icons.jsx'

// Date helpers

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - Date.now()) / 86_400_000)
}

function formatDisplay(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Expiry badge

function ExpiryBadge({ days }) {
  if (days === null) return null
  if (days < 0)   return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-600">Expired</span>
  if (days === 0) return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-600">Expires today</span>
  if (days <= 3)  return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-600">Expires in {days}d</span>
  if (days <= 7)  return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">Expires in {days}d</span>
  return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-700">Expires in {days}d</span>
}

// Ingredient card

function IngredientCard({ item, expDate, onRemove, onSetExpiry }) {
  const [editing, setEditing] = useState(false)
  const days = daysUntil(expDate)

  const borderAccent =
    days === null ? '' :
    days <= 3     ? 'border-l-red-400' :
    days <= 7     ? 'border-l-amber-400' :
                    'border-l-green-400'

  const bgAccent =
    days !== null && days <= 3 ? 'bg-red-50/40' :
    days !== null && days <= 7 ? 'bg-amber-50/30' : 'bg-white'

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className={`card-interactive relative flex flex-col gap-3 rounded-2xl border border-olive/20 border-l-4 ${borderAccent} ${bgAccent} p-4 shadow-sm`}>

      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest/10 text-forest">
          <Leaf size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-bold capitalize text-bark">{item}</p>
          <p className="mt-0.5 text-[11px] text-bark-light/45">In pantry</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item)}
          className="shrink-0 rounded-lg p-1 text-bark-light/30 transition hover:bg-red-50 hover:text-red-400"
          aria-label={`Remove ${item}`}
        >
          <X size={13} />
        </button>
      </div>

      <div>
        {editing ? (
          <div className="flex flex-col gap-2">
            <input
              type="date"
              defaultValue={expDate ?? ''}
              min={today}
              autoFocus
              className="w-full rounded-xl border border-olive/30 px-3 py-2 text-sm text-bark outline-none focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-forest/20"
              onChange={e => { if (e.target.value) onSetExpiry(item, e.target.value) }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 rounded-xl bg-forest px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90 active:scale-95"
              >
                Done
              </button>
              {expDate && (
                <button
                  type="button"
                  onClick={() => { onSetExpiry(item, null); setEditing(false) }}
                  className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ) : expDate ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex w-full items-center justify-between rounded-xl border border-olive/20 bg-white/80 px-3 py-2 transition hover:border-olive/40 hover:bg-white"
          >
            <ExpiryBadge days={days} />
            <span className="text-[10px] text-bark-light/40">{formatDisplay(expDate)}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-olive/30 px-3 py-2 text-[11px] font-semibold text-bark-light/40 transition hover:border-forest/40 hover:text-forest"
          >
            <span className="text-base leading-none font-light">+</span>
            Set expiry date
          </button>
        )}
      </div>
    </div>
  )
}

export default function PantryView({ ingredientsList, expirations, onRemove, onClear, onSetExpiry, onNavigateHome }) {
  const useSoon = ingredientsList
    .filter(item => { const d = daysUntil(expirations[item.toLowerCase()]); return d !== null && d <= 7 })
    .sort((a, b) => (daysUntil(expirations[a.toLowerCase()]) ?? 999) - (daysUntil(expirations[b.toLowerCase()]) ?? 999))

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
            className="btn-danger rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100">
            Clear pantry
          </button>
        )}
      </div>

      {ingredientsList.length > 0 ? (
        <div className="space-y-8">

          {useSoon.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-red-500/80">Use Soon</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600">{useSoon.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {useSoon.map(item => (
                  <IngredientCard key={item} item={item}
                    expDate={expirations[item.toLowerCase()] ?? null}
                    onRemove={onRemove} onSetExpiry={onSetExpiry} />
                ))}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div>
              {useSoon.length > 0 && (
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-bark-light/40">All items</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {rest.map(item => (
                  <IngredientCard key={item} item={item}
                    expDate={expirations[item.toLowerCase()] ?? null}
                    onRemove={onRemove} onSetExpiry={onSetExpiry} />
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
