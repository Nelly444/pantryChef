import { useEffect, useState } from 'react'

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const KEY = 'pantry-meal-plan'

function empty() {
  return Object.fromEntries(DAYS.map(d => [d, null]))
}

export function useMealPlan() {
  const [plan, setPlan] = useState(() => {
    try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } }
    catch { return empty() }
  })

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(plan)) }, [plan])

  const assign   = (day, result) => setPlan(p => ({ ...p, [day]: result }))
  const remove   = (day)         => setPlan(p => ({ ...p, [day]: null }))
  const clear    = ()            => setPlan(empty())

  const generate = (results, expirations = {}) => {
    if (!results.length) return
    // Score: match % + bonus for recipes that use soon-to-expire pantry items
    const scored = results.map(r => {
      const urgencyBonus = (r.recipe.usedIngredients ?? []).reduce((sum, ing) => {
        const name = ing.name?.toLowerCase() ?? ''
        const date = expirations[name]
        if (!date) return sum
        const days = Math.ceil((new Date(date) - Date.now()) / 86_400_000)
        return sum + (days <= 3 ? 20 : days <= 7 ? 10 : 0)
      }, 0)
      return { result: r, score: r.match_percentage + urgencyBonus }
    })
    scored.sort((a, b) => b.score - a.score)

    const newPlan = empty()
    DAYS.forEach((day, i) => { newPlan[day] = scored[i]?.result ?? null })
    setPlan(newPlan)
  }

  const plannedCount    = Object.values(plan).filter(Boolean).length
  const missingAll      = Object.values(plan)
    .filter(Boolean)
    .flatMap(r => r.missing_ingredients ?? [])
  const uniqueMissing   = [...new Set(missingAll.map(m => m.toLowerCase()))]

  return { plan, DAYS, DAY_SHORT, assign, remove, clear, generate, plannedCount, uniqueMissing }
}
