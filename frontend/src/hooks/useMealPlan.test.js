import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMealPlan, DAYS, DAY_SHORT } from './useMealPlan.js'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem:  (k) => store[k] ?? null,
    setItem:  (k, v) => { store[k] = String(v) },
    removeItem:(k) => { delete store[k] },
    clear:    () => { store = {} },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

const makeResult = (id, title, match = 80, missing = []) => ({
  recipe: { id, title, usedIngredients: [] },
  match_percentage: match,
  missing_ingredients: missing,
  nutrition: { calories: 400, protein: 20, fat: 10, carbs: 50 },
})

describe('DAYS / DAY_SHORT exports', () => {
  it('has 7 days', () => {
    expect(DAYS).toHaveLength(7)
    expect(DAY_SHORT).toHaveLength(7)
  })

  it('starts on Monday', () => {
    expect(DAYS[0]).toBe('Monday')
    expect(DAY_SHORT[0]).toBe('Mon')
  })
})

describe('useMealPlan', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('starts with an empty plan', () => {
    const { result } = renderHook(() => useMealPlan())
    expect(result.current.plannedCount).toBe(0)
    DAYS.forEach(day => expect(result.current.plan[day]).toBeNull())
  })

  it('assign() adds a recipe to a day', () => {
    const { result } = renderHook(() => useMealPlan())
    const r = makeResult(1, 'Pasta')
    act(() => result.current.assign('Monday', r))
    expect(result.current.plan.Monday).toEqual(r)
    expect(result.current.plannedCount).toBe(1)
  })

  it('remove() clears a day', () => {
    const { result } = renderHook(() => useMealPlan())
    const r = makeResult(1, 'Pasta')
    act(() => result.current.assign('Monday', r))
    act(() => result.current.remove('Monday'))
    expect(result.current.plan.Monday).toBeNull()
    expect(result.current.plannedCount).toBe(0)
  })

  it('clear() empties all days', () => {
    const { result } = renderHook(() => useMealPlan())
    act(() => {
      result.current.assign('Monday', makeResult(1, 'Pasta'))
      result.current.assign('Friday', makeResult(2, 'Salad'))
    })
    act(() => result.current.clear())
    expect(result.current.plannedCount).toBe(0)
    DAYS.forEach(day => expect(result.current.plan[day]).toBeNull())
  })

  it('generate() fills all 7 days in score order', () => {
    const { result } = renderHook(() => useMealPlan())
    const recipes = Array.from({ length: 10 }, (_, i) =>
      makeResult(i + 1, `Recipe ${i + 1}`, (i + 1) * 10)
    )
    act(() => result.current.generate(recipes))
    expect(result.current.plannedCount).toBe(7)
    // Best match (100%) should be on Monday
    expect(result.current.plan.Monday.match_percentage).toBe(100)
  })

  it('generate() does nothing with empty results', () => {
    const { result } = renderHook(() => useMealPlan())
    act(() => result.current.generate([]))
    expect(result.current.plannedCount).toBe(0)
  })

  it('generate() gives urgency bonus to expiring ingredients', () => {
    const { result } = renderHook(() => useMealPlan())

    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]
    const goodRecipe = makeResult(1, 'Good', 90)
    const urgentRecipe = {
      ...makeResult(2, 'Urgent', 50),
      recipe: { id: 2, title: 'Urgent', usedIngredients: [{ name: 'milk' }] },
    }

    act(() => result.current.generate([goodRecipe, urgentRecipe], { milk: tomorrow }))

    // urgentRecipe gets +20 bonus (expires in 1 day ≤3), total 70 > 90? No, 50+20=70 < 90.
    // So goodRecipe should still be Monday.
    expect(result.current.plan.Monday.recipe.title).toBe('Good')
  })

  it('uniqueMissing de-duplicates across days (case-insensitive)', () => {
    const { result } = renderHook(() => useMealPlan())
    act(() => {
      result.current.assign('Monday', makeResult(1, 'A', 60, ['Garlic', 'Onion']))
      result.current.assign('Tuesday', makeResult(2, 'B', 60, ['garlic', 'Milk']))
    })
    // 'Garlic'/'garlic' should count as one
    expect(result.current.uniqueMissing).toHaveLength(3)
    expect(result.current.uniqueMissing).toContain('garlic')
    expect(result.current.uniqueMissing).toContain('onion')
    expect(result.current.uniqueMissing).toContain('milk')
  })

  it('persists plan to localStorage', () => {
    const { result } = renderHook(() => useMealPlan())
    const r = makeResult(99, 'Stored Recipe')
    act(() => result.current.assign('Wednesday', r))
    const stored = JSON.parse(localStorageMock.getItem('pantry-meal-plan'))
    expect(stored.Wednesday.recipe.id).toBe(99)
  })

  it('loads plan from localStorage on mount', () => {
    const r = makeResult(42, 'Pre-saved')
    localStorageMock.setItem('pantry-meal-plan', JSON.stringify({ Monday: r }))
    const { result } = renderHook(() => useMealPlan())
    expect(result.current.plan.Monday?.recipe.id).toBe(42)
  })
})
