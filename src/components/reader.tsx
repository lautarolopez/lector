import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ThemeToggle } from '#/components/theme-toggle'
import { useTextPages } from '#/hooks/use-text-pages'
import {
  DEFAULT_FONT_SIZE_INDEX,
  FONT_SIZE_STEPS,
  loadFontSizeIndex,
  loadPage,
  saveFontSizeIndex,
  savePage,
} from '#/lib/text-store'

const pageTextClassName =
  'font-reading whitespace-pre-wrap break-words text-ink'

const SEARCH_DEBOUNCE_MS = 300
const FONT_SIZE_DEBOUNCE_MS = 300

function getWindowFrameSize() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return {
    width: Math.min(vw, (vh * 16) / 9),
    height: Math.min(vh, (vw * 9) / 16),
  }
}

function highlightMatches(text: string, query: string): ReactNode {
  const needle = query.trim()
  if (!needle) return text

  const lowerText = text.toLowerCase()
  const lowerNeedle = needle.toLowerCase()
  const parts: ReactNode[] = []
  let start = 0
  let key = 0

  while (start <= text.length) {
    const matchAt = lowerText.indexOf(lowerNeedle, start)
    if (matchAt === -1) {
      if (start < text.length) parts.push(text.slice(start))
      break
    }
    if (matchAt > start) parts.push(text.slice(start, matchAt))
    parts.push(
      <span
        key={key++}
        className="text-foxglove underline decoration-foxglove underline-offset-[3px]"
      >
        {text.slice(matchAt, matchAt + needle.length)}
      </span>,
    )
    start = matchAt + needle.length
  }

  return parts.length > 0 ? parts : text
}

type ReaderProps = {
  text: string
  onExit: () => void
  className?: string
}

export function Reader({ text, onExit, className = '' }: ReaderProps) {
  const [pageIndex, setPageIndex] = useState(() => loadPage())
  const [turnKey, setTurnKey] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [fontSizeIndex, setFontSizeIndex] = useState(() => loadFontSizeIndex())
  const [appliedFontSizeIndex, setAppliedFontSizeIndex] = useState(
    () => loadFontSizeIndex(),
  )
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [frameSize, setFrameSize] = useState(() =>
    typeof window === 'undefined'
      ? { width: 1280, height: 720 }
      : getWindowFrameSize(),
  )
  const [fullscreenScale, setFullscreenScale] = useState(1)

  const rootRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const frameSizeRef = useRef(frameSize)
  frameSizeRef.current = frameSize

  const fontSizeRem =
    FONT_SIZE_STEPS[appliedFontSizeIndex] ??
    FONT_SIZE_STEPS[DEFAULT_FONT_SIZE_INDEX]

  const { pages, ready } = useTextPages({
    text,
    containerRef: pageRef,
    measureRef,
    fontSizeRem,
  })

  useEffect(() => {
    if (fontSizeIndex === appliedFontSizeIndex) return

    const timeout = window.setTimeout(() => {
      setAppliedFontSizeIndex(fontSizeIndex)
      saveFontSizeIndex(fontSizeIndex)
    }, FONT_SIZE_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [appliedFontSizeIndex, fontSizeIndex])

  useEffect(() => {
    if (!ready) return
    setPageIndex((i) => {
      const next = Math.min(i, Math.max(pages.length - 1, 0))
      if (next !== i) savePage(next)
      return next
    })
  }, [pages.length, ready])

  const goTo = useCallback(
    (next: number) => {
      setPageIndex((current) => {
        const clamped = Math.max(0, Math.min(next, pages.length - 1))
        if (clamped !== current) {
          savePage(clamped)
          setTurnKey((k) => k + 1)
        }
        return clamped
      })
    },
    [pages.length],
  )

  const prev = useCallback(() => goTo(pageIndex - 1), [goTo, pageIndex])
  const next = useCallback(() => goTo(pageIndex + 1), [goTo, pageIndex])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery('')
  }, [])

  const syncFullscreenScale = useCallback(() => {
    const { width, height } = frameSizeRef.current
    if (width <= 0 || height <= 0) return
    setFullscreenScale(
      Math.min(window.innerWidth / width, window.innerHeight / height),
    )
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const node = rootRef.current
    if (!node) return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await node.requestFullscreen()
      }
    } catch {
      // Fullscreen may be blocked by the browser
    }
  }, [])

  useEffect(() => {
    function onFullscreenChange() {
      const active = document.fullscreenElement === rootRef.current
      setIsFullscreen(active)
      if (active) {
        syncFullscreenScale()
      } else {
        setFrameSize(getWindowFrameSize())
        setFullscreenScale(1)
      }
    }

    function onResize() {
      if (document.fullscreenElement) {
        syncFullscreenScale()
        return
      }
      setFrameSize(getWindowFrameSize())
      setFullscreenScale(1)
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('resize', onResize)
    }
  }, [syncFullscreenScale])

  useEffect(() => {
    if (!searchOpen) return
    searchInputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen || !ready) return

    const query = searchQuery.trim()
    if (!query) return

    const timeout = window.setTimeout(() => {
      const needle = query.toLowerCase()
      const matchIndex = pages.findIndex((page) =>
        page.toLowerCase().includes(needle),
      )
      if (matchIndex >= 0) goTo(matchIndex)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [goTo, pages, ready, searchOpen, searchQuery])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target
      const inChrome =
        target instanceof HTMLElement &&
        (target.closest('[data-reader-search]') != null ||
          target.closest('[data-reader-font]') != null)

      if (inChrome) {
        if (e.key === 'Escape') {
          e.preventDefault()
          if (searchOpen) closeSearch()
        }
        return
      }

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      } else if (
        e.key === 'ArrowRight' ||
        e.key === 'PageDown' ||
        e.key === ' '
      ) {
        e.preventDefault()
        next()
      } else if (
        (e.key === 'f' || e.key === 'F') &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        e.preventDefault()
        void toggleFullscreen()
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          // Browser exits fullscreen; stay in the reader
          return
        }
        e.preventDefault()
        onExit()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeSearch, next, onExit, prev, searchOpen, toggleFullscreen])

  const page = pages[pageIndex] ?? ''
  const canPrev = pageIndex > 0
  const canNext = pageIndex < pages.length - 1
  const pageStyle = {
    fontSize: `${fontSizeRem}rem`,
    lineHeight: 1.7,
  } as const

  return (
    <div
      ref={rootRef}
      className={`bg-surface text-ink flex h-dvh w-dvw items-center justify-center overflow-hidden ${className}`}
    >
      <div
        className="relative origin-center"
        style={{
          width: frameSize.width,
          height: frameSize.height,
          transform:
            fullscreenScale === 1 ? undefined : `scale(${fullscreenScale})`,
        }}
      >
        <button
          type="button"
          onClick={prev}
          disabled={!canPrev}
          className="text-foxglove enabled:hover:bg-foxglove/10 disabled:text-foxglove/25 absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-sm p-2 transition enabled:cursor-pointer disabled:cursor-default sm:left-3"
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="size-8 sm:size-10" />
        </button>

        <button
          type="button"
          onClick={next}
          disabled={!canNext}
          className="text-foxglove enabled:hover:bg-foxglove/10 disabled:text-foxglove/25 absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-sm p-2 transition enabled:cursor-pointer disabled:cursor-default sm:right-3"
          aria-label="Next page"
        >
          <ChevronRightIcon className="size-8 sm:size-10" />
        </button>

        <div className="flex h-full flex-col px-14 pt-10 pb-10 sm:px-20 sm:pt-12 sm:pb-12">
          <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
            <p className="font-reading text-ink-muted/70 text-sm tracking-wide">
              Esc para volver
            </p>
            <div className="flex items-center gap-1">
              <ThemeToggle
                className="text-ink-muted hover:text-ink hover:bg-ink/5 size-8"
                iconClassName="size-5"
              />
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="text-ink-muted hover:text-ink hover:bg-ink/5 rounded-sm p-1.5 transition"
                aria-label={
                  isFullscreen
                    ? 'Salir de pantalla completa'
                    : 'Pantalla completa'
                }
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="size-5" />
                ) : (
                  <ArrowsPointingOutIcon className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div ref={pageRef} className="min-h-0 flex-1 overflow-hidden">
            {ready ? (
              <div
                key={turnKey}
                className={`animate-page-in h-full ${pageTextClassName}`}
                style={pageStyle}
              >
                {searchOpen && searchQuery.trim()
                  ? highlightMatches(page, searchQuery)
                  : page}
              </div>
            ) : null}
          </div>

          <div className="relative mt-4 flex min-h-9 shrink-0 items-center justify-center">
            <div
              data-reader-font
              className="absolute top-1/2 left-0 flex -translate-y-1/2 items-center gap-2"
            >
              <span
                aria-hidden
                className="font-display text-ink-muted block text-sm leading-none font-semibold tracking-tight"
              >
                Aa
              </span>
              <label className="sr-only" htmlFor="font-size">
                Tamaño de fuente
              </label>
              <input
                id="font-size"
                type="range"
                min={0}
                max={FONT_SIZE_STEPS.length - 1}
                step={1}
                value={fontSizeIndex}
                onChange={(e) =>
                  setFontSizeIndex(Number.parseInt(e.target.value, 10))
                }
                className="accent-foxglove h-1.5 w-24 cursor-pointer sm:w-28"
              />
            </div>

            <p className="font-display text-ink-muted text-sm tracking-wide">
              {ready ? `${pageIndex + 1} / ${pages.length}` : '…'}
            </p>

            <div
              data-reader-search
              className="absolute top-1/2 right-0 flex -translate-y-1/2 items-center"
            >
              {searchOpen ? (
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar"
                    spellCheck={false}
                    className="border-border bg-panel text-ink placeholder:text-ink-muted/70 font-reading focus:border-foxglove/60 focus:ring-foxglove/40 w-40 rounded-sm border py-1.5 pr-8 pl-2.5 text-sm outline-none transition focus:ring-1 sm:w-48"
                    aria-label="Buscar en el texto"
                  />
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="text-ink-muted hover:text-ink absolute top-1/2 right-1 -translate-y-1/2 rounded-sm p-1 transition"
                    aria-label="Cerrar búsqueda"
                  >
                    <XMarkIcon className="size-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="text-ink-muted hover:text-ink hover:bg-ink/5 rounded-sm p-1.5 transition"
                  aria-label="Buscar"
                >
                  <MagnifyingGlassIcon className="size-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          ref={measureRef}
          aria-hidden
          className={`pointer-events-none invisible absolute top-0 left-0 ${pageTextClassName}`}
          style={pageStyle}
        />
      </div>
    </div>
  )
}
