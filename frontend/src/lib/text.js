export function stripHtml(html) {
  if (!html) return ''
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Strips HTML from Spoonacular summaries and removes raw ingredient sentences.
export function cleanSummary(html, maxChars = 600) {
  if (!html) return ''

  let text = String(html)
    .replace(/\$\s*<[^>]+>\s*(\d)/g, '$$$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  text = text.replace(/\s+([,.])/g, '$1')

  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text]

  const ingredientLine = /^\s*[\d¼-¾⅐-⅞][\d/]*\s*(c|T|tsp|tbsp|oz|cup|g|lb|kg|ml)\b/i
  const prose = sentences.filter(s => !ingredientLine.test(s.trim()))

  let result = ''
  for (const sentence of prose) {
    if (result.length + sentence.length > maxChars) break
    result += sentence
  }

  return result.trim()
}
