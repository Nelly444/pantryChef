import { useState } from 'react'

const KEY = 'pantryChefFavs'

export function useFavorites() {
  const [favs, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
    catch { return [] }
  })

  // Accepts the full result object so missing_ingredients and nutrition are preserved
  const toggle = (result) => {
    const recipe = result.recipe ?? result          // also accept bare recipe objects
    const matchPct = result.match_percentage ?? result.matchPct ?? 0
    const missing  = result.missing_ingredients ?? []
    const nutrition = result.nutrition ?? null

    setFavs(prev => {
      const exists = prev.some(f => f.id === recipe.id)
      const next = exists
        ? prev.filter(f => f.id !== recipe.id)
        : [{
            ...recipe,
            match_percentage: matchPct,
            missing_ingredients: missing,
            nutrition,
            savedAt: Date.now(),
          }, ...prev].slice(0, 20)
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const isFav = (id) => favs.some(f => f.id === id)

  return { favs, toggle, isFav }
}
