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

  const generate = (results) => {
    if (!results.length) return
    // Results arrive pre-sorted by the backend (match % + urgency bonus).
    // Assign using a per-meal-type offset so the same recipe doesn't appear
    // as Breakfast, Lunch, AND Dinner on the same day.
    const autoTypes = ['Breakfast', 'Lunch', 'Dinner']
    const n = results.length
    const offset = Math.max(1, Math.floor(n / autoTypes.length))

    const newPlan = empty()
    autoTypes.forEach((mealType, mi) => {
      DAYS.forEach((day, di) => {
        newPlan[day][mealType] = results[(di + mi * offset) % n]
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
