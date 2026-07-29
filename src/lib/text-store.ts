const TEXT_KEY = 'lector:text'
const PAGE_KEY = 'lector:page'
const FONT_SIZE_KEY = 'lector:font-size'

/** Slider steps — index 1 matches the previous default (text-xl). */
export const FONT_SIZE_STEPS = [1.125, 1.25, 1.5, 1.75, 2.125] as const
export const DEFAULT_FONT_SIZE_INDEX = 1

export function saveText(text: string) {
  try {
    localStorage.setItem(TEXT_KEY, text)
  } catch {
    // ignore quota / private mode
  }
}

export function loadText(): string | null {
  try {
    return localStorage.getItem(TEXT_KEY)
  } catch {
    return null
  }
}

export function savePage(pageIndex: number) {
  try {
    localStorage.setItem(PAGE_KEY, String(pageIndex))
  } catch {
    // ignore
  }
}

export function loadPage(): number {
  try {
    const raw = localStorage.getItem(PAGE_KEY)
    if (raw == null) return 0
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function saveFontSizeIndex(index: number) {
  try {
    localStorage.setItem(FONT_SIZE_KEY, String(index))
  } catch {
    // ignore
  }
}

export function loadFontSizeIndex(): number {
  try {
    const raw = localStorage.getItem(FONT_SIZE_KEY)
    if (raw == null) return DEFAULT_FONT_SIZE_INDEX
    const n = Number.parseInt(raw, 10)
    if (!Number.isFinite(n) || n < 0 || n >= FONT_SIZE_STEPS.length) {
      return DEFAULT_FONT_SIZE_INDEX
    }
    return n
  } catch {
    return DEFAULT_FONT_SIZE_INDEX
  }
}

export function clearReading() {
  try {
    localStorage.removeItem(TEXT_KEY)
    localStorage.removeItem(PAGE_KEY)
    // Clean up legacy session key if present
    sessionStorage.removeItem(TEXT_KEY)
  } catch {
    // ignore
  }
}
