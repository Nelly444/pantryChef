import { useState, useRef, useEffect } from 'react'
import EmptyState from './EmptyState.jsx'
import { Leaf, X } from './Icons.jsx'

// ── Date helpers ──────────────────────────────────────────────────────────────

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - Date.now()) / 86_400_000)
}

function addDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function formatDisplay(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const PRESETS = [
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
]

// ── Expiry badge ──────────────────────────────────────────────────────────────

function ExpiryBadge({ days }) {
  if (days === null) return null
  if (days < 0)  return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-600">Expired</span>
  if (days === 0) return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-600">Expires today</span>
  if (days <= 3)  return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-600">Expires in {days}d</span>
  if (days <= 7)  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">Expires in {days}d</span>
  return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-700">Expires {formatDisplay(null) ?? `in ${days}d`}</span>
}

// ── Expiry picker popover ─────────────────────────────────────────────────────

function ExpiryPicker({ item, expDate, onSetExpiry, onClose }) {
  const [showCustom, setShowCustom] = useState(false)
  const ref = useRef(null)

  // Default custom selects to today + 7
  const defaultDate = expDate ? new Date(expDate + 'T00:00:00') : (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d })()
  const [month, setMonth] = useState(defaultDate.getMonth())
  const [day,   setDay]   = useState(defaultDate.getDate())
  const [year,  setYear]  = useState(defaultDate.getFullYear())

  // Dismiss on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const applyCustom = () => {
    const pad = n => String(n).padStart(2, '0')
    onSetExpiry(item, `${year}-${pad(month + 1)}-${pad(day)}`)
    onClose()
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 4 }, (_, i) => currentYear + i)

  const selectCls = 'rounded-lg border border-olive/30 bg-white px-2 py-1.5 text-sm text-bark outline-none focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-forest/20 cursor-pointer appearance-none pr-6 bg-no-repeat bg-[right_0.4rem_center]'

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-olive/20 bg-white shadow-xl"
    >
      {/* Quick presets */}
      <div className="p-3">
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-bark-light/40">Quick set</p>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map(({ label, days }) => {
            const target = addDays(days)
            const active = expDate === target
            return (
              <button
                key={label}
                type="button"
                onClick={() => { onSetExpiry(item, target); onClose() }}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 ${
                  active
                    ? 'border-forest bg-forest text-white shadow-sm'
                    : 'border-olive/30 bg-cream text-bark-light hover:border-forest/40 hover:text-bark'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom date */}
      <div className="border-t border-olive/15 p-3">
        <button
          type="button"
          onClick={() => setShowCustom(v => !v)}
          className="flex w-full items-center justify-between text-[10px] font-black uppercase tracking-widest text-bark-light/40 hover:text-bark-light transition-colors"
        >
          Custom date
          <span className="text-xs">{showCustom ? '▲' : '▼'}</span>
        </button>

        {showCustom && (
          <div className="mt-2.5 flex items-center gap-1.5">
            {/* Month */}
            <div className="relative flex-1">
              <select value={month} onChange={e => setMonth(+e.target.value)} className={selectCls}>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            {/* Day */}
            <div className="relative w-14">
              <select value={day} onChange={e => setDay(+e.target.value)} className={selectCls}>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            {/* Year */}
            <div className="relative w-20">
              <select value={year} onChange={e => setYear(+e.target.value)} className={selectCls}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button
              type="button"
              onClick={applyCustom}
              className="rounded-xl bg-forest px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90 active:scale-95"
            >
              Set
            </button>
          </div>
        )}
      </div>

      {/* Remove */}
      {expDate && (
        <div className="border-t border-olive/15 px-3 py-2">
          <button
            type="button"
            onClick={() => { onSetExpiry(item, null); onClose() }}
            className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
          >
            Remove expiry date
          </button>
        </div>
      )}
    </div>
  )
}

// ── Ingredient card ───────────────────────────────────────────────────────────

function IngredientCard({ item, expDate, onRemove, onSetExpiry }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const days = daysUntil(expDate)

  const borderAccent =
    days === null      ? '' :
    days <= 3          ? 'border-l-red-400' :
    days <= 7          ? 'border-l-amber-400' :
                         'border-l-green-400'

  const bgAccent =
    days !== null && days <= 3 ? 'bg-red-50/40' :
    days !== null && days <= 7 ? 'bg-amber-50/30' : 'bg-white'

  return (
    <div className={`card-interactive relative flex flex-col gap-3 rounded-2xl border border-olive/20 border-l-4 ${borderAccent} ${bgAccent} p-4 shadow-sm`}>

      {/* Top row: icon + name + remove */}
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

      {/* Expiry row */}
      <div className="relative">
        {expDate ? (
          <button
            type="button"
            onClick={() => setPickerOpen(v => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-olive/20 bg-white/80 px-3 py-2 transition hover:border-olive/40 hover:bg-white"
          >
            <div className="flex items-center gap-2">
              <ExpiryBadge days={days} />
            </div>
            <span className="text-[10px] text-bark-light/40">{formatDisplay(expDate)}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen(v => !v)}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-olive/30 px-3 py-2 text-[11px] font-semibold text-bark-light/40 transition hover:border-forest/40 hover:text-forest"
          >
            <span className="text-base leading-none font-light">+</span>
            Set expiry date
          </button>
        )}

        {pickerOpen && (
          <ExpiryPicker
            item={item}
            expDate={expDate}
            onSetExpiry={onSetExpiry}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function PantryView({ ingredientsList, expirations, onRemove, onClear, onSetExpiry, onNavigateHome }) {
  const useSoon = ingredientsList
    .filter(item => { const d = daysUntil(expirations[item.toLowerCase()]); return d !== null && d <= 7 })
    .sort((a, b) => (daysUntil(expirations[a.toLowerCase()]) ?? 999) - (daysUntil(expirations[b.toLowerCase()]) ?? 999))

  const rest = ingredientsList.filter(item => !useSoon.includes(item))

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

      {/* Header */}
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

          {/* Use Soon section */}
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

          {/* All other items */}
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
