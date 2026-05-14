import { useEffect, useState } from 'react'

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const MEAL_TYPES = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snack']

const KEY = 'pantry-meal-plan'

function empty() {
  return Object.fromEntries(
    DAYS.map(d => [d, Object.fromEntries(MEAL_TYPES.map(m => [m, null]))])
  )
}

function migrate(raw) {
  const base = empty()
  for (const [day, val] of Object.entries(raw)) {
    if (!DAYS.includes(day)) continue
    // Only carry over values that look like the new nested format { mealType: result }
    // Skip nulls, old flat result objects, and anything unexpected
    if (val && typeof val === 'object' && !Array.isArray(val) && !val.recipe && !val.match_percentage) {
      base[day] = { ...base[day], ...val }
    }
  }
  return base
}

export function useMealPlan() {
  const [plan, setPlan] = useState(() => {
    try { return migrate(JSON.parse(localStorage.getItem(KEY) || '{}')) }
    catch { return empty() }
  })

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(plan)) }, [plan])

  const assign = (day, mealType, result) =>
    setPlan(p => ({ ...p, [day]: { ...p[day], [mealType]: result } }))

  const remove = (day, mealType) =>
    setPlan(p => ({ ...p, [day]: { ...p[day], [mealType]: null } }))

  const clear = () => setPlan(empty())

  const generate = (results, expirations = {}) => {
    if (!results.length) return
    // Score: match % + bonus for soon-to-expire items
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
    let idx = 0
    // Fill Breakfast, Lunch, Dinner for every day; leave Brunch and Snack empty
    const autoTypes = ['Breakfast', 'Lunch', 'Dinner']
    DAYS.forEach(day => {
      autoTypes.forEach(mealType => {
        newPlan[day][mealType] = scored[idx % scored.length].result
        idx++
      })
    })
    setPlan(newPlan)
  }

  const allSlots = Object.values(plan).flatMap(day =>
    day && typeof day === 'object' ? Object.values(day) : []
  )
  const plannedCount = allSlots.filter(Boolean).length

  const missingAll = allSlots
    .filter(Boolean)
    .flatMap(r => r.missing_ingredients ?? [])
  const uniqueMissing = [...new Set(missingAll.map(m => m.toLowerCase()))]

  return { plan, DAYS, DAY_SHORT, MEAL_TYPES, assign, remove, clear, generate, plannedCount, uniqueMissing }
}
