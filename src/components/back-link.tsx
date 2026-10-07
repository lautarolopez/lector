import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Link } from '@tanstack/react-router'

type BackLinkProps = {
  className?: string
}

export function BackLink({
  className = 'absolute top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-30',
}: BackLinkProps) {
  return (
    <Link
      to="/"
      className={`text-ink-muted hover:text-ink hover:bg-ink/5 font-reading inline-flex h-10 items-center gap-1.5 rounded-sm px-2 text-sm tracking-wide transition ${className}`}
    >
      <ArrowLeftIcon className="size-4" />
      Inicio
    </Link>
  )
}
