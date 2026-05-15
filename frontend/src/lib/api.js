const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function formatHttpError(status, data) {
  // Backend sends { error: '...' } for 4xx/5xx responses
  if (typeof data?.error === 'string') return data.error
  // FastAPI/Pydantic validation sends { detail: [...] }
  if (data?.detail) {
    const d = data.detail
    if (Array.isArray(d)) return d.map(e => e.msg || JSON.stringify(e)).join(' ')
    if (typeof d === 'string') return d
  }
  return `Request failed (${status})`
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options)
  let data = {}
  try { data = await res.json() } catch { /* non-json */ }
  if (!res.ok) throw new Error(formatHttpError(res.status, data))
  if (data?.error) throw new Error(data.error)
  return data
}

// POST /api/recipes/suggest → { results: [...] }
export async function suggestRecipes(body, signal) {
  return apiFetch(`${API_BASE}/api/recipes/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
}

// GET /api/recipes/:id/detail → { recipe, nutrition }
export async function getRecipeDetail(recipeId, serving = 1) {
  return apiFetch(`${API_BASE}/api/recipes/${recipeId}/detail?serving=${serving}`)
}
