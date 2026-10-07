import { ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline'
import { Dropdown, DropdownHeader, DropdownTitle } from '#/components/dropdown'
import type { RepeatedWord } from '#/lib/repeated-words'

type RepeatedWordsMenuProps = {
  words: RepeatedWord[]
  selectedWord: string | null
  onSelect: (word: string | null) => void
}

export function RepeatedWordsMenu({
  words,
  selectedWord,
  onSelect,
}: RepeatedWordsMenuProps) {
  return (
    <Dropdown
      label="Palabras repetidas"
      active={selectedWord !== null}
      triggerClassName="font-reading gap-1.5 px-2 text-sm tracking-wide"
      panelClassName="flex max-h-[min(24rem,70dvh)] w-64 flex-col overflow-hidden"
      trigger={
        <>
          <ArrowPathRoundedSquareIcon className="size-5" />
          <span className="hidden xl:inline">Palabras repetidas</span>
          <span
            className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs leading-none font-semibold tabular-nums ${
              words.length > 0
                ? 'bg-foxglove text-night-sky'
                : 'bg-ink/10 text-ink-muted'
            }`}
          >
            {words.length}
          </span>
        </>
      }
    >
      <DropdownHeader>
        <DropdownTitle>Palabras repetidas</DropdownTitle>
        {selectedWord && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(null)}
            className="text-foxglove hover:text-ink text-xs transition"
          >
            Quitar resaltado
          </button>
        )}
      </DropdownHeader>

      {words.length === 0 ? (
        <p className="text-ink-muted font-reading px-3 py-4 text-sm">
          No hay palabras repetidas.
        </p>
      ) : (
        <ul className="overflow-y-auto py-1">
          {words.map(({ key, word, variants, count }) => {
            const selected = key === selectedWord
            return (
              <li key={key}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelect(selected ? null : key)}
                  aria-pressed={selected}
                  className={`font-reading flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition ${
                    selected
                      ? 'bg-foxglove/20 text-ink'
                      : 'text-ink hover:bg-ink/5'
                  }`}
                >
                  <span className="truncate">
                    {word}
                    {variants.length > 0 && (
                      <span className="text-ink-muted">
                        {' / '}
                        {variants.join(' / ')}
                      </span>
                    )}
                  </span>
                  <span className="text-ink-muted shrink-0 text-xs tabular-nums">
                    {count}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Dropdown>
  )
}
