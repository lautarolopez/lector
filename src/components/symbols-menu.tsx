import { useEffect, useState } from 'react'
import { Dropdown, DropdownHeader, DropdownTitle } from '#/components/dropdown'

type SymbolItem = {
  char: string
  name: string
}

const SIGNS: SymbolItem[] = [
  { char: '¿', name: 'Apertura de interrogación' },
  { char: '¡', name: 'Apertura de exclamación' },
  { char: '«', name: 'Comilla angular de apertura' },
  { char: '»', name: 'Comilla angular de cierre' },
  { char: '“', name: 'Comilla doble de apertura' },
  { char: '”', name: 'Comilla doble de cierre' },
  { char: '‘', name: 'Comilla simple de apertura' },
  { char: '’', name: 'Comilla simple de cierre' },
  { char: '—', name: 'Raya' },
  { char: '–', name: 'Semirraya' },
  { char: '…', name: 'Puntos suspensivos' },
  { char: 'º', name: 'Ordinal masculino' },
  { char: 'ª', name: 'Ordinal femenino' },
  { char: '€', name: 'Euro' },
]

const LETTERS: SymbolItem[] = [...'áéíóúüñÁÉÍÓÚÜÑ'].map((char) => ({
  char,
  name: char,
}))

const COPIED_MS = 1200

function SymbolGrid({
  items,
  copied,
  onCopy,
}: {
  items: SymbolItem[]
  copied: string | null
  onCopy: (char: string) => void
}) {
  return (
    <div className="grid grid-cols-[repeat(7,2.25rem)] gap-1">
      {items.map(({ char, name }) => (
        <button
          key={char}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCopy(char)}
          aria-label={`Copiar ${name}`}
          title={name}
          className={`font-reading text-ink flex size-9 items-center justify-center rounded-sm text-lg transition ${
            copied === char ? 'bg-foxglove/30' : 'hover:bg-ink/5'
          }`}
        >
          {char}
        </button>
      ))}
    </div>
  )
}

export function SymbolsMenu() {
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(null), COPIED_MS)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function copy(char: string) {
    try {
      await navigator.clipboard.writeText(char)
      setCopied(char)
    } catch {
      // Clipboard access can be denied by the browser
    }
  }

  return (
    <Dropdown
      label="Símbolos"
      triggerClassName="font-display w-9 justify-center text-base font-semibold"
      trigger={<span aria-hidden>¿¡</span>}
      panelClassName="w-max"
    >
      <DropdownHeader>
        <DropdownTitle>Símbolos</DropdownTitle>
        {copied && (
          <span className="text-foxglove text-xs">Copiado {copied}</span>
        )}
      </DropdownHeader>
      <div className="flex flex-col gap-2 p-2">
        <SymbolGrid items={SIGNS} copied={copied} onCopy={copy} />
        <div aria-hidden className="bg-border mx-1 h-px" />
        <SymbolGrid items={LETTERS} copied={copied} onCopy={copy} />
      </div>
    </Dropdown>
  )
}
