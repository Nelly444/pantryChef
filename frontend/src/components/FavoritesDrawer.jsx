import { useEffect } from 'react'
import { HeartFilled, Bowl, Plate } from './Icons.jsx'

export default function FavoritesDrawer({ favs, onSelect, onClose }) {
  // Close on ESC — matches CookingMode and standard modal behaviour
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[300] flex justify-end bg-bark/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Saved recipes"
        className="h-full w-full max-w-sm overflow-y-auto bg-cream shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b-2 border-olive/30 bg-cream px-5 py-4">
          <h2 className="font-display flex items-center gap-2 text-xl font-bold text-bark">
            <HeartFilled size={18} className="text-forest" /> Saved Recipes
          </h2>
          <button
            type="button"
            aria-label="Close saved recipes"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-bark/10 text-bark hover:bg-bark/20"
          >
            ✕
          </button>
        </div>

        {favs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-bark-light/60">
            <Bowl size={48} className="opacity-40" />
            <p className="text-sm">No saved recipes yet.</p>
            <p className="text-xs">Tap the heart on any recipe card.</p>
          </div>
        ) : (
          <ul className="divide-y divide-olive/20 px-4 py-2">
            {favs.map(f => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => { onSelect(f); onClose() }}
                  className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-cream-dark/60 rounded-xl px-2"
                >
                  {f.image ? (
                    <img src={f.image} alt="" className="h-14 w-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-olive-light shrink-0 grid place-items-center text-bark-light/50">
                      <Plate size={24} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-bark line-clamp-2">{f.title}</p>
                    <p className="text-xs text-sage mt-0.5">{f.matchPct}% pantry match</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
