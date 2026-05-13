const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function formatHttpError(status, data) {
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

// POST /recipes/suggest → { results: [...] }
export async function suggestRecipes(body) {
  return apiFetch(`${API_BASE}/recipes/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// GET /recipes/:id/detail → { recipe, nutrition }
export async function getRecipeDetail(recipeId, serving = 1) {
  return apiFetch(`${API_BASE}/recipes/${recipeId}/detail?serving=${serving}`)
}
