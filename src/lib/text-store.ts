const TEXT_KEY = 'lector:text'
const PAGE_KEY = 'lector:page'

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
