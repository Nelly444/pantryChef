const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function formatHttpError(status, data) {
  if (data?.detail) {
    const d = data.detail
    if (Array.isArray(d)) {
      return d.map((e) => e.msg || JSON.stringify(e)).join(' ')
    }
    if (typeof d === 'string') return d
  }
  return `Request failed (${status})`
}

// POST /recipes/suggest
export async function suggestRecipe(body) {
  const url = `${API_BASE}/recipes/suggest`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let data = {}
  try {
    data = await res.json()
  } catch {
    // non-json body
  }
  if (!res.ok) {
    throw new Error(formatHttpError(res.status, data))
  }
  if (data?.error) {
    throw new Error(data.error)
  }
  return data
}
