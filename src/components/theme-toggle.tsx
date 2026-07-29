import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { toggleTheme } from '#/lib/theme'

type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({
  className = 'text-ink/50 hover:bg-ink/5 hover:text-ink',
}: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      className={`relative size-10 shrink-0 rounded-sm transition ${className}`}
      aria-label="Toggle color theme"
    >
      <SunIcon
        aria-hidden
        className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity dark:opacity-100"
      />
      <MoonIcon
        aria-hidden
        className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 opacity-100 transition-opacity dark:opacity-0"
      />
    </button>
  )
}
