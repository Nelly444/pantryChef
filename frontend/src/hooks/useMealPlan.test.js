import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMealPlan, DAYS, DAY_SHORT, MEAL_TYPES } from './useMealPlan.js'

// ── localStorage mock ─────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store = {}
  return {
    getItem:   (k) => store[k] ?? null,
    setItem:   (k, v) => { store[k] = String(v) },
    removeItem:(k) => { delete store[k] },
    clear:     () => { store = {} },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeResult = (id, title, match = 80, missing = []) => ({
  recipe: { id, title, usedIngredients: [] },
  match_percentage: match,
  missing_ingredients: missing,
  nutrition: { calories: 400, protein: 20, fat: 10, carbs: 50 },
})

// ── Exports ───────────────────────────────────────────────────────────────────

describe('DAYS / DAY_SHORT / MEAL_TYPES exports', () => {
  it('has 7 days', () => {
    expect(DAYS).toHaveLength(7)
    expect(DAY_SHORT).toHaveLength(7)
  })

  it('starts on Monday', () => {
    expect(DAYS[0]).toBe('Monday')
    expect(DAY_SHORT[0]).toBe('Mon')
  })

  it('exports 5 meal types', () => {
    expect(MEAL_TYPES).toHaveLength(5)
    expect(MEAL_TYPES).toContain('Breakfast')
    expect(MEAL_TYPES).toContain('Lunch')
    expect(MEAL_TYPES).toContain('Dinner')
  })
})

// ── Hook behaviour ────────────────────────────────────────────────────────────

describe('useMealPlan', () => {
  beforeEach(() => localStorageMock.clear())

  it('starts with an empty plan — each day has all meal types set to null', () => {
    const { result } = renderHook(() => useMealPlan())
    expect(result.current.plannedCount).toBe(0)
    DAYS.forEach(day => {
      expect(result.current.plan[day]).toBeTruthy()
      MEAL_TYPES.forEach(mt => expect(result.current.plan[day][mt]).toBeNull())
    })
  })

  it('assign() adds a recipe to a specific day + meal type', () => {
    const { result } = renderHook(() => useMealPlan())
    const r = makeResult(1, 'Pasta')
    act(() => result.current.assign('Monday', 'Lunch', r))
    expect(result.current.plan.Monday.Lunch).toEqual(r)
    expect(result.current.plan.Monday.Breakfast).toBeNull()
    expect(result.current.plannedCount).toBe(1)
  })

  it('assign() does not overwrite other meal types in the same day', () => {
    const { result } = renderHook(() => useMealPlan())
    act(() => {
      result.current.assign('Monday', 'Breakfast', makeResult(1, 'Oats'))
      result.current.assign('Monday', 'Dinner', makeResult(2, 'Steak'))
    })
    expect(result.current.plan.Monday.Breakfast.recipe.title).toBe('Oats')
    expect(result.current.plan.Monday.Dinner.recipe.title).toBe('Steak')
    expect(result.current.plan.Monday.Lunch).toBeNull()
    expect(result.current.plannedCount).toBe(2)
  })

  it('remove() clears a specific meal type slot', () => {
    const { result } = renderHook(() => useMealPlan())
    act(() => result.current.assign('Monday', 'Lunch', makeResult(1, 'Pasta')))
    act(() => result.current.remove('Monday', 'Lunch'))
    expect(result.current.plan.Monday.Lunch).toBeNull()
    expect(result.current.plannedCount).toBe(0)
  })

  it('remove() only clears the targeted slot, not the whole day', () => {
    const { result } = renderHook(() => useMealPlan())
    act(() => {
      result.current.assign('Monday', 'Breakfast', makeResult(1, 'Oats'))
      result.current.assign('Monday', 'Dinner', makeResult(2, 'Steak'))
    })
    act(() => result.current.remove('Monday', 'Breakfast'))
    expect(result.current.plan.Monday.Breakfast).toBeNull()
    expect(result.current.plan.Monday.Dinner.recipe.title).toBe('Steak')
    expect(result.current.plannedCount).toBe(1)
  })

  it('clear() resets all meal type slots across all days', () => {
    const { result } = renderHook(() => useMealPlan())
    act(() => {
      result.current.assign('Monday', 'Lunch', makeResult(1, 'Pasta'))
      result.current.assign('Friday', 'Dinner', makeResult(2, 'Salad'))
    })
    act(() => result.current.clear())
    expect(result.current.plannedCount).toBe(0)
    DAYS.forEach(day =>
      MEAL_TYPES.forEach(mt => expect(result.current.plan[day][mt]).toBeNull())
    )
  })

  it('generate() does nothing with empty results', () => {
    const { result } = renderHook(() => useMealPlan())
    act(() => result.current.generate([]))
    expect(result.current.plannedCount).toBe(0)
  })

  it('generate() fills Breakfast/Lunch/Dinner for all 7 days (21 slots)', () => {
    const { result } = renderHook(() => useMealPlan())
    const recipes = Array.from({ length: 6 }, (_, i) =>
      makeResult(i + 1, `Recipe ${i + 1}`, (i + 1) * 10)
    )
    act(() => result.current.generate(recipes))
    expect(result.current.plannedCount).toBe(21)
    DAYS.forEach(day => {
      expect(result.current.plan[day].Breakfast).not.toBeNull()
      expect(result.current.plan[day].Lunch).not.toBeNull()
      expect(result.current.plan[day].Dinner).not.toBeNull()
      // Brunch and Snack should remain empty
      expect(result.current.plan[day].Brunch).toBeNull()
      expect(result.current.plan[day].Snack).toBeNull()
    })
  })

  it('generate() uses results in the order provided (backend pre-sorts by score)', () => {
    const { result } = renderHook(() => useMealPlan())
    // Results arrive pre-sorted: best first
    const recipes = [
      makeResult(1, 'Best',   100),
      makeResult(2, 'Second', 80),
      makeResult(3, 'Third',  60),
    ]
    act(() => result.current.generate(recipes))
    // Monday Breakfast should be the first result
    expect(result.current.plan.Monday.Breakfast.recipe.title).toBe('Best')
  })

  it('generate() gives each day a different recipe per meal type (no same recipe in B/L/D)', () => {
    const { result } = renderHook(() => useMealPlan())
    const recipes = Array.from({ length: 6 }, (_, i) =>
      makeResult(i + 1, `Recipe ${i + 1}`, 80)
    )
    act(() => result.current.generate(recipes))
    // For every day, Breakfast/Lunch/Dinner should be different recipes
    DAYS.forEach(day => {
      const bId = result.current.plan[day].Breakfast.recipe.id
      const lId = result.current.plan[day].Lunch.recipe.id
      const dId = result.current.plan[day].Dinner.recipe.id
      expect(bId).not.toBe(lId)
      expect(lId).not.toBe(dId)
      expect(bId).not.toBe(dId)
    })
  })

  it('uniqueMissing de-duplicates across all meal type slots (case-insensitive)', () => {
    const { result } = renderHook(() => useMealPlan())
    act(() => {
      result.current.assign('Monday', 'Lunch',   makeResult(1, 'A', 60, ['Garlic', 'Onion']))
      result.current.assign('Tuesday', 'Dinner', makeResult(2, 'B', 60, ['garlic', 'Milk']))
    })
    expect(result.current.uniqueMissing).toHaveLength(3)
    expect(result.current.uniqueMissing).toContain('garlic')
    expect(result.current.uniqueMissing).toContain('onion')
    expect(result.current.uniqueMissing).toContain('milk')
  })

  it('persists plan to localStorage after assignment', () => {
    const { result } = renderHook(() => useMealPlan())
    const r = makeResult(99, 'Stored Recipe')
    act(() => result.current.assign('Wednesday', 'Dinner', r))
    const stored = JSON.parse(localStorageMock.getItem('pantry-meal-plan'))
    expect(stored.Wednesday.Dinner.recipe.id).toBe(99)
    expect(stored.Wednesday.Breakfast).toBeNull()
  })

  it('loads valid nested plan from localStorage on mount', () => {
    const r = makeResult(42, 'Pre-saved')
    localStorageMock.setItem('pantry-meal-plan', JSON.stringify({
      Monday: { Breakfast: r, Brunch: null, Lunch: null, Dinner: null, Snack: null },
    }))
    const { result } = renderHook(() => useMealPlan())
    expect(result.current.plan.Monday.Breakfast?.recipe.id).toBe(42)
    expect(result.current.plan.Monday.Lunch).toBeNull()
  })

  it('migration: discards old flat-format localStorage data instead of crashing', () => {
    // Old format: day → result (not day → mealType → result)
    const oldResult = makeResult(1, 'OldPasta')
    localStorageMock.setItem('pantry-meal-plan', JSON.stringify({ Monday: oldResult }))
    const { result } = renderHook(() => useMealPlan())
    // Should start fresh — no crash, no garbage in plan
    expect(result.current.plannedCount).toBe(0)
    MEAL_TYPES.forEach(mt => expect(result.current.plan.Monday[mt]).toBeNull())
  })

  it('migration: handles all-null old localStorage data without crashing', () => {
    localStorageMock.setItem('pantry-meal-plan', JSON.stringify({
      Monday: null, Tuesday: null, Wednesday: null,
      Thursday: null, Friday: null, Saturday: null, Sunday: null,
    }))
    const { result } = renderHook(() => useMealPlan())
    expect(result.current.plannedCount).toBe(0)
  })
})
