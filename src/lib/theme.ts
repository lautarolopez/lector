export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'lector:theme'

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function resolveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
  root.style.colorScheme = theme
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // ignore quota / private mode
  }
  applyTheme(theme)
}

export function toggleTheme() {
  const next: Theme = document.documentElement.classList.contains('dark')
    ? 'light'
    : 'dark'
  setTheme(next)
}

/** Inline in <head> so theme is applied before first paint (no flash / shift). */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var d=t==='dark'||t==='light'?t:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var r=document.documentElement;r.classList.add(d);r.style.colorScheme=d;r.style.backgroundColor=d==='dark'?'#2a2a35':'#e2e2da';}catch(e){document.documentElement.classList.add('light');document.documentElement.style.backgroundColor='#e2e2da';}})();`
