import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { suggestRecipes, getRecipeDetail } from './api.js'

// Intercept fetch globally
function mockFetch(status, body) {
  globalThis.fetch = vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })
}

function mockFetchNetworkError() {
  globalThis.fetch = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'))
}

afterEach(() => { vi.restoreAllMocks() })

describe('suggestRecipes', () => {
  it('returns results on success', async () => {
    const payload = { results: [{ recipe: { id: 1, title: 'Pasta' }, match_percentage: 90 }] }
    mockFetch(200, payload)
    const data = await suggestRecipes({ ingredients: ['pasta'], serving: 2 })
    expect(data.results).toHaveLength(1)
    expect(data.results[0].recipe.title).toBe('Pasta')
  })

  it('throws on 422 validation error with Pydantic detail array', async () => {
    mockFetch(422, { detail: [{ msg: 'value is not a valid list' }] })
    await expect(suggestRecipes({ ingredients: [] })).rejects.toThrow('value is not a valid list')
  })

  it('throws on 502 with error string', async () => {
    mockFetch(502, { error: 'Spoonacular API unavailable' })
    await expect(suggestRecipes({ ingredients: ['egg'] })).rejects.toThrow('Spoonacular API unavailable')
  })

  it('throws on 404 no-matches response', async () => {
    mockFetch(404, { error: 'No matching recipes found.' })
    await expect(suggestRecipes({ ingredients: ['unicorn'] })).rejects.toThrow('No matching recipes found.')
  })

  it('throws a generic message on non-JSON response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new SyntaxError('not json') },
    })
    await expect(suggestRecipes({ ingredients: ['egg'] })).rejects.toThrow('500')
  })

  it('propagates network errors', async () => {
    mockFetchNetworkError()
    await expect(suggestRecipes({ ingredients: ['egg'] })).rejects.toThrow('Failed to fetch')
  })

  it('throws if response body has top-level error field (success status)', async () => {
    mockFetch(200, { error: 'something went wrong' })
    await expect(suggestRecipes({ ingredients: ['egg'] })).rejects.toThrow('something went wrong')
  })
})

describe('getRecipeDetail', () => {
  it('returns recipe and nutrition on success', async () => {
    const payload = { recipe: { id: 5, title: 'Stew' }, nutrition: { calories: 350 } }
    mockFetch(200, payload)
    const data = await getRecipeDetail(5, 2)
    expect(data.recipe.title).toBe('Stew')
    expect(data.nutrition.calories).toBe(350)
  })

  it('includes serving param in URL', async () => {
    mockFetch(200, { recipe: {}, nutrition: {} })
    await getRecipeDetail(7, 4)
    const calledUrl = globalThis.fetch.mock.calls[0][0]
    expect(calledUrl).toContain('serving=4')
    expect(calledUrl).toContain('/recipes/7/detail')
  })

  it('throws on 502 Spoonacular error', async () => {
    mockFetch(502, { error: 'API quota exceeded' })
    await expect(getRecipeDetail(1)).rejects.toThrow('API quota exceeded')
  })

  it('defaults serving to 1 when omitted', async () => {
    mockFetch(200, { recipe: {}, nutrition: {} })
    await getRecipeDetail(3)
    const calledUrl = globalThis.fetch.mock.calls[0][0]
    expect(calledUrl).toContain('serving=1')
  })
})
