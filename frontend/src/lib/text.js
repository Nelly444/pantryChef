export function stripHtml(html) {
  if (!html) return ''
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Cleans Spoonacular summary HTML into readable prose.
// Fixes spacing artifacts, restores currency symbols, and drops
// sentences that are raw ingredient data rather than description text.
export function cleanSummary(html, maxChars = 600) {
  if (!html) return ''

  let text = String(html)
    // Restore dollar amounts before stripping tags (e.g. <b>$1.13</b> → $1.13)
    .replace(/\$\s*<[^>]+>\s*(\d)/g, '$$$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Fix spaces before punctuation left by stripped tags
  text = text.replace(/\s+([,.])/g, '$1')

  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text]

  // Drop sentences that look like raw ingredient lines (start with a
  // measurement or fraction, e.g. "2/3c caramelized onions")
  const ingredientLine = /^\s*[\d¼-¾⅐-⅞][\d/]*\s*(c|T|tsp|tbsp|oz|cup|g|lb|kg|ml)\b/i
  const prose = sentences.filter(s => !ingredientLine.test(s.trim()))

  // Build output up to maxChars, always ending at a sentence boundary
  let result = ''
  for (const sentence of prose) {
    if (result.length + sentence.length > maxChars) break
    result += sentence
  }

  return result.trim()
}
