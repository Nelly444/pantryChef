const INGREDIENT_RE = /^[a-zA-ZÀ-ÿ0-9][a-zA-ZÀ-ÿ0-9 '\-.,()/%]*$/
const DIET_RE = /^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ \-]*$/
// Only http/https — blocks javascript:, data:, vbscript:, etc.
const SAFE_URL_RE = /^https?:\/\//i

const VALID_MEALS = new Set([
  'breakfast', 'brunch', 'lunch', 'dinner',
  'snack', 'appetizer', 'dessert', 'soup', 'salad',
])

export function validateIngredient(raw) {
  const s = raw.trim()
  if (!s) return 'Enter an ingredient name.'
  if (s.length > 60) return 'Ingredient name is too long (max 60 characters).'
  if (!INGREDIENT_RE.test(s)) return 'Ingredient contains invalid characters. Only letters, digits, spaces, and basic punctuation are allowed.'
  return null
}

export function validateDietTerm(raw) {
  const s = raw.trim()
  if (!s) return null
  if (s.length > 50) return 'Dietary restriction is too long (max 50 characters).'
  if (!DIET_RE.test(s)) return 'Dietary restriction contains invalid characters. Only letters, spaces, and hyphens are allowed.'
  return null
}

export function isSafeUrl(url) {
  return typeof url === 'string' && SAFE_URL_RE.test(url)
}

export function isValidMeal(meal) {
  return !meal || VALID_MEALS.has(meal)
}
