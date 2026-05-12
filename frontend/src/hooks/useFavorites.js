import { useState } from 'react'

export function useFavorites() {
  const [favs, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pantryChefFavs') || '[]') }
    catch { return [] }
  })

  const toggle = (recipe, matchPct) => {
    setFavs(prev => {
      const exists = prev.some(f => f.id === recipe.id)
      const next = exists
        ? prev.filter(f => f.id !== recipe.id)
        : [{ id: recipe.id, title: recipe.title, image: recipe.image, matchPct, savedAt: Date.now() }, ...prev].slice(0, 20)
      try { localStorage.setItem('pantryChefFavs', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const isFav = (id) => favs.some(f => f.id === id)

  return { favs, toggle, isFav }
}
