/**
 * Client-side input validation — mirrors the rules enforced by the backend.
 * Running the same checks here gives the user instant feedback without a round trip.
 * The backend is still the authoritative gate; these are a UX convenience only.
 */

// Must start with a letter or digit (incl. accented chars).
// Allows: letters, digits, space, apostrophe, hyphen, period, comma, parens, slash, percent.
// Blocks: < > & ; | ` $ \ { } [ ] ^ ~ " = + * @ ! # and control characters —
//         the characters that appear in XSS payloads, SQL injection, and shell injection.
const INGREDIENT_RE = /^[a-zA-ZÀ-ÿ0-9][a-zA-ZÀ-ÿ0-9 '\-.,()/%]*$/

// Dietary restrictions: letters (incl. accented), spaces, hyphens only.
// Covers "gluten-free", "lacto-vegetarian", "plant-based", etc.
const DIET_RE = /^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ \-]*$/

// Only http and https URLs are safe to render as anchor hrefs.
// Blocks javascript:, data:, vbscript:, and other executable protocols.
const SAFE_URL_RE = /^https?:\/\//i

const VALID_MEALS = new Set([
  'breakfast', 'brunch', 'lunch', 'dinner',
  'snack', 'appetizer', 'dessert', 'soup', 'salad',
])

/**
 * Validate a single ingredient name.
 * Returns an error string, or null if valid.
 */
export function validateIngredient(raw) {
  const s = raw.trim()
  if (!s) return 'Enter an ingredient name.'
  if (s.length > 60) return 'Ingredient name is too long (max 60 characters).'
  if (!INGREDIENT_RE.test(s)) return 'Ingredient contains invalid characters. Only letters, digits, spaces, and basic punctuation are allowed.'
  return null
}

/**
 * Validate a single dietary restriction term.
 * Returns an error string, or null if valid.
 */
export function validateDietTerm(raw) {
  const s = raw.trim()
  if (!s) return null
  if (s.length > 50) return 'Dietary restriction is too long (max 50 characters).'
  if (!DIET_RE.test(s)) return 'Dietary restriction contains invalid characters. Only letters, spaces, and hyphens are allowed.'
  return null
}

/**
 * Returns true only if the URL uses http or https.
 * Use this before rendering any API-supplied URL as an anchor href.
 */
export function isSafeUrl(url) {
  return typeof url === 'string' && SAFE_URL_RE.test(url)
}

/**
 * Returns true if meal is one of the values the backend accepts.
 */
export function isValidMeal(meal) {
  return !meal || VALID_MEALS.has(meal)
}
