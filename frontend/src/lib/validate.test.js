import { describe, it, expect } from 'vitest'
import { validateIngredient, validateDietTerm, isSafeUrl, isValidMeal } from './validate.js'

// validateIngredient

describe('validateIngredient', () => {
  it('accepts normal ingredient names', () => {
    expect(validateIngredient('chicken breast')).toBeNull()
    expect(validateIngredient('olive oil')).toBeNull()
    expect(validateIngredient('eggs')).toBeNull()
    expect(validateIngredient("bell pepper")).toBeNull()
    expect(validateIngredient("garlic")).toBeNull()
  })

  it('accepts names with allowed punctuation', () => {
    expect(validateIngredient("fish sauce")).toBeNull()
    expect(validateIngredient("all-purpose flour")).toBeNull()
    expect(validateIngredient("tomato (canned)")).toBeNull()
    expect(validateIngredient("50% lean beef")).toBeNull()
  })

  it('rejects empty or whitespace-only strings', () => {
    expect(validateIngredient('')).toBeTruthy()
    expect(validateIngredient('   ')).toBeTruthy()
  })

  it('rejects names exceeding 60 characters', () => {
    expect(validateIngredient('a'.repeat(61))).toMatch(/too long/i)
  })

  it('accepts exactly 60 characters', () => {
    expect(validateIngredient('a'.repeat(60))).toBeNull()
  })

  it('rejects XSS payloads', () => {
    expect(validateIngredient('<script>alert(1)</script>')).toBeTruthy()
    expect(validateIngredient('&lt;img src=x&gt;')).toBeTruthy()
    expect(validateIngredient('"><svg onload=alert(1)>')).toBeTruthy()
  })

  it('rejects SQL injection patterns', () => {
    expect(validateIngredient("' OR 1=1 --")).toBeTruthy()
    expect(validateIngredient('; DROP TABLE users')).toBeTruthy()
    expect(validateIngredient('1 UNION SELECT * FROM recipes')).toBeTruthy()
  })

  it('rejects shell injection characters', () => {
    expect(validateIngredient('$(cat /etc/passwd)')).toBeTruthy()
    expect(validateIngredient('`whoami`')).toBeTruthy()
    expect(validateIngredient('| rm -rf /')).toBeTruthy()
    expect(validateIngredient('egg; ls -la')).toBeTruthy()
  })

  it('trims surrounding whitespace before validating', () => {
    expect(validateIngredient('  garlic  ')).toBeNull()
  })
})

// validateDietTerm

describe('validateDietTerm', () => {
  it('returns null for empty string (optional field)', () => {
    expect(validateDietTerm('')).toBeNull()
    expect(validateDietTerm('   ')).toBeNull()
  })

  it('accepts valid dietary terms', () => {
    expect(validateDietTerm('vegetarian')).toBeNull()
    expect(validateDietTerm('gluten-free')).toBeNull()
    expect(validateDietTerm('plant based')).toBeNull()
    expect(validateDietTerm('lacto-vegetarian')).toBeNull()
  })

  it('rejects terms exceeding 50 characters', () => {
    expect(validateDietTerm('a'.repeat(51))).toMatch(/too long/i)
  })

  it('rejects terms with digits or symbols', () => {
    expect(validateDietTerm('vegan123')).toBeTruthy()
    expect(validateDietTerm('<script>')).toBeTruthy()
    expect(validateDietTerm('; DROP TABLE')).toBeTruthy()
  })
})

// isSafeUrl

describe('isSafeUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isSafeUrl('https://example.com/recipe')).toBe(true)
    expect(isSafeUrl('http://example.com')).toBe(true)
  })

  it('rejects javascript: protocol', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeUrl('JAVASCRIPT:void(0)')).toBe(false)
  })

  it('rejects data: URIs', () => {
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejects vbscript:', () => {
    expect(isSafeUrl('vbscript:MsgBox(1)')).toBe(false)
  })

  it('rejects relative paths', () => {
    expect(isSafeUrl('/etc/passwd')).toBe(false)
    expect(isSafeUrl('../../secret')).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(isSafeUrl(null)).toBe(false)
    expect(isSafeUrl(undefined)).toBe(false)
    expect(isSafeUrl(42)).toBe(false)
  })
})

// isValidMeal

describe('isValidMeal', () => {
  it('accepts all valid meal types', () => {
    const meals = ['breakfast', 'brunch', 'lunch', 'dinner', 'snack', 'appetizer', 'dessert', 'soup', 'salad']
    meals.forEach(m => expect(isValidMeal(m)).toBe(true))
  })

  it('accepts null and undefined (meal type is optional)', () => {
    expect(isValidMeal(null)).toBe(true)
    expect(isValidMeal(undefined)).toBe(true)
    expect(isValidMeal('')).toBe(true)
  })

  it('rejects unknown meal types', () => {
    expect(isValidMeal('pizza')).toBe(false)
    expect(isValidMeal('pasta')).toBe(false)
    expect(isValidMeal('<script>')).toBe(false)
  })
})
