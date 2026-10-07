import { useEffect, useRef, useState, type ReactNode } from 'react'

type DropdownProps = {
  label: string
  active?: boolean
  trigger: ReactNode
  triggerClassName?: string
  panelClassName?: string
  children: ReactNode
}

export function Dropdown({
  label,
  active,
  trigger,
  triggerClassName = '',
  panelClassName = '',
  children,
}: DropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        // Keep the editor's selection so a copied symbol can be pasted right away
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        title={label}
        className={`flex h-9 items-center rounded-sm transition ${
          open || active
            ? 'bg-ink/10 text-ink'
            : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
        } ${triggerClassName}`}
      >
        {trigger}
      </button>

      {open && (
        <div
          className={`bg-panel border-border absolute top-full right-0 z-20 mt-2 rounded-md border shadow-lg ${panelClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownHeader({ children }: { children: ReactNode }) {
  return (
    <div className="border-border flex items-center justify-between gap-2 border-b px-3 py-2">
      {children}
    </div>
  )
}

export function DropdownTitle({ children }: { children: ReactNode }) {
  return (
    <span className="text-ink-muted text-xs font-semibold tracking-wide uppercase">
      {children}
    </span>
  )
}
