/**
 * Split text into pages that fit a measured container.
 * Concatenation of pages is always identical to the original text —
 * spaces, punctuation, and symbols are never altered or dropped.
 */
export function paginateText(
  text: string,
  fits: (slice: string) => boolean,
): string[] {
  if (text.length === 0) return ['']

  const pages: string[] = []
  let start = 0

  while (start < text.length) {
    const end = findPageEnd(text, start, fits)
    pages.push(text.slice(start, end))
    start = end
  }

  return pages
}

function findPageEnd(
  text: string,
  start: number,
  fits: (slice: string) => boolean,
): number {
  if (start >= text.length) return start

  // At least one character per page so we always make progress
  if (!fits(text.slice(start, start + 1))) {
    return Math.min(start + 1, text.length)
  }

  let low = start + 1
  let high = text.length
  let best = start + 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (fits(text.slice(start, mid))) {
      best = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  if (best >= text.length) return text.length

  // Prefer breaking after whitespace when it still leaves content on the page
  const slice = text.slice(start, best)
  const breakAt = findLastBreak(slice)
  if (breakAt > 0) {
    return start + breakAt
  }

  return best
}

function findLastBreak(slice: string): number {
  for (let i = slice.length - 1; i >= 1; i--) {
    const ch = slice[i]!
    if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') {
      return i + 1
    }
  }
  return -1
}
