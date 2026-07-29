import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { toggleTheme } from '#/lib/theme'

type ThemeToggleProps = {
  className?: string
  iconClassName?: string
}

export function ThemeToggle({
  className = 'size-10 text-ink/50 hover:bg-ink/5 hover:text-ink',
  iconClassName = 'size-6',
}: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      className={`relative shrink-0 rounded-sm transition ${className}`}
      aria-label="Toggle color theme"
    >
      <SunIcon
        aria-hidden
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity dark:opacity-100 ${iconClassName}`}
      />
      <MoonIcon
        aria-hidden
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-100 transition-opacity dark:opacity-0 ${iconClassName}`}
      />
    </button>
  )
}
