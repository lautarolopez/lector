import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  BoldIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ItalicIcon,
  UnderlineIcon,
} from '@heroicons/react/24/outline'
import { createFileRoute } from '@tanstack/react-router'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { BackLink } from '#/components/back-link'
import { RepeatedWordsMenu } from '#/components/repeated-words-menu'
import { SymbolsMenu } from '#/components/symbols-menu'
import { ThemeToggle } from '#/components/theme-toggle'
import { getEditorHtml, getSelectionHtml } from '#/lib/clipboard-html'
import {
  findRepeatedWords,
  highlightWord,
  indexText,
  type RepeatedWord,
} from '#/lib/repeated-words'
import { countText, type TextStats } from '#/lib/text-stats'
import {
  DEFAULT_FONT_SIZE_INDEX,
  FONT_SIZE_STEPS,
  loadEditorHtml,
  loadFontSizeIndex,
  saveEditorHtml,
  saveFontSizeIndex,
} from '#/lib/text-store'

export const Route = createFileRoute('/editor')({ component: Editor })

type Align = 'left' | 'center' | 'right' | 'justify'

type FormatState = {
  bold: boolean
  italic: boolean
  underline: boolean
  align: Align
}

const INITIAL_FORMAT: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  align: 'left',
}

const SAVE_DEBOUNCE_MS = 300
const ANALYZE_DEBOUNCE_MS = 300

const ALIGN_COMMANDS: Record<Align, string> = {
  left: 'justifyLeft',
  center: 'justifyCenter',
  right: 'justifyRight',
  justify: 'justifyFull',
}

const ALIGN_LABELS: Record<Align, string> = {
  left: 'Alinear a la izquierda',
  center: 'Centrar',
  right: 'Alinear a la derecha',
  justify: 'Justificar',
}

const ALIGN_LINES: Record<Align, [string, string]> = {
  left: ['M3.75 6.75h16.5M3.75 14.25h16.5', 'M3.75 10.5h10.5M3.75 18h10.5'],
  center: ['M3.75 6.75h16.5M3.75 14.25h16.5', 'M6.75 10.5h10.5M6.75 18h10.5'],
  right: ['M3.75 6.75h16.5M3.75 14.25h16.5', 'M9.75 10.5h10.5M9.75 18h10.5'],
  justify: ['M3.75 6.75h16.5M3.75 14.25h16.5', 'M3.75 10.5h16.5M3.75 18h16.5'],
}

function AlignIcon({ align, className }: { align: Align; className?: string }) {
  const [long, short] = ALIGN_LINES[align]
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={`${long}${short}`} />
    </svg>
  )
}

function readFormatState(): FormatState {
  const align = (Object.keys(ALIGN_COMMANDS) as Align[]).find((key) =>
    document.queryCommandState(ALIGN_COMMANDS[key]),
  )
  return {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
    align: align ?? 'left',
  }
}

type ToolbarButtonProps = {
  label: string
  active?: boolean
  onPress: () => void
  children: ReactNode
}

function ToolbarButton({ label, active, onPress, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      // Keep the editor's selection when clicking toolbar buttons
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`flex size-8 items-center sm:size-9 justify-center rounded-sm transition ${
        active
          ? 'bg-ink/10 text-ink'
          : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span aria-hidden className="bg-border mx-0.5 h-5 w-px sm:mx-1" />
}

function placeCaretAtEnd(editor: HTMLElement) {
  const selection = document.getSelection()
  if (!selection) return
  editor.focus()
  const range = document.createRange()
  range.selectNodeContents(editor)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

function Editor() {
  const rootRef = useRef<HTMLElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<number | null>(null)
  const analyzeTimeoutRef = useRef<number | null>(null)
  const selectedWordRef = useRef<string | null>(null)
  const [format, setFormat] = useState<FormatState>(INITIAL_FORMAT)
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [repeatedWords, setRepeatedWords] = useState<RepeatedWord[]>([])
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [stats, setStats] = useState<TextStats>({ words: 0, characters: 0 })
  // Read after mount: the page is prerendered, so storage isn't available on first render
  const [fontSizeIndex, setFontSizeIndex] = useState(DEFAULT_FONT_SIZE_INDEX)

  const fontSizeRem =
    FONT_SIZE_STEPS[fontSizeIndex] ?? FONT_SIZE_STEPS[DEFAULT_FONT_SIZE_INDEX]

  const flushSave = useCallback(() => {
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    const editor = editorRef.current
    if (editor) saveEditorHtml(editor.innerHTML)
  }, [])

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = window.setTimeout(flushSave, SAVE_DEBOUNCE_MS)
  }, [flushSave])

  const selectWord = useCallback((word: string | null) => {
    selectedWordRef.current = word
    setSelectedWord(word)
    const editor = editorRef.current
    highlightWord(editor && word ? indexText(editor) : null, word)
  }, [])

  const analyze = useCallback(() => {
    if (analyzeTimeoutRef.current !== null) {
      window.clearTimeout(analyzeTimeoutRef.current)
      analyzeTimeoutRef.current = null
    }
    const editor = editorRef.current
    if (!editor) return
    const indexed = indexText(editor)
    const words = findRepeatedWords(indexed.text)
    setRepeatedWords(words)
    setStats(countText(indexed.text))

    const selected = selectedWordRef.current
    if (selected && !words.some(({ key }) => key === selected)) {
      selectWord(null)
    } else {
      highlightWord(indexed, selected)
    }
  }, [selectWord])

  const scheduleAnalyze = useCallback(() => {
    if (analyzeTimeoutRef.current !== null) {
      window.clearTimeout(analyzeTimeoutRef.current)
    }
    analyzeTimeoutRef.current = window.setTimeout(analyze, ANALYZE_DEBOUNCE_MS)
  }, [analyze])

  useEffect(() => {
    setFontSizeIndex(loadFontSizeIndex())
    const editor = editorRef.current
    if (!editor) return
    editor.innerHTML = loadEditorHtml() ?? ''
    placeCaretAtEnd(editor)
    analyze()
  }, [analyze])

  useEffect(
    () => () => {
      if (analyzeTimeoutRef.current !== null) {
        window.clearTimeout(analyzeTimeoutRef.current)
      }
      highlightWord(null, null)
    },
    [],
  )

  useEffect(() => {
    // The ref is already null during unmount cleanup, so keep the node itself
    const editor = editorRef.current
    window.addEventListener('pagehide', flushSave)
    return () => {
      window.removeEventListener('pagehide', flushSave)
      if (saveTimeoutRef.current === null || !editor) return
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
      saveEditorHtml(editor.innerHTML)
    }
  }, [flushSave])

  const syncFormat = useCallback(() => {
    const editor = editorRef.current
    const anchor = document.getSelection()?.anchorNode
    if (!editor || !anchor || !editor.contains(anchor)) return
    setFormat(readFormatState())
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', syncFormat)
    return () => document.removeEventListener('selectionchange', syncFormat)
  }, [syncFormat])

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timeout)
  }, [copied])

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === rootRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  async function toggleFullscreen() {
    const root = rootRef.current
    if (!root) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await root.requestFullscreen()
      }
    } catch {
      // Fullscreen may be blocked by the browser
    }
  }

  function changeFontSize(index: number) {
    setFontSizeIndex(index)
    saveFontSizeIndex(index)
  }

  function runCommand(command: string) {
    editorRef.current?.focus()
    document.execCommand(command)
    syncFormat()
    scheduleSave()
    scheduleAnalyze()
  }

  function handleInput() {
    syncFormat()
    scheduleSave()
    scheduleAnalyze()
  }

  function focusAtEnd(e: MouseEvent) {
    if (e.target !== e.currentTarget) return
    const editor = editorRef.current
    if (!editor) return
    e.preventDefault()
    placeCaretAtEnd(editor)
  }

  async function copyAll() {
    const editor = editorRef.current
    if (!editor) return
    const html = getEditorHtml(editor)
    const plain = editor.innerText

    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' }),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(plain)
      }
      setCopied(true)
    } catch {
      // Clipboard access can be denied by the browser
    }
  }

  function handleCopy(e: ClipboardEvent<HTMLDivElement>) {
    const editor = editorRef.current
    const selection = document.getSelection()
    if (!editor || !selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    if (range.collapsed) return

    e.preventDefault()
    e.clipboardData.setData('text/html', getSelectionHtml(range, editor))
    e.clipboardData.setData('text/plain', selection.toString())

    if (e.type === 'cut') {
      document.execCommand('delete')
      scheduleSave()
      scheduleAnalyze()
    }
  }

  return (
    <main
      ref={rootRef}
      className="bg-surface text-ink relative flex h-dvh flex-col"
    >
      <header className="grid shrink-0 grid-cols-[1fr_auto] items-center gap-y-1 pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-2 pl-[max(0.75rem,env(safe-area-inset-left))] lg:grid-cols-[1fr_auto_1fr]">
        <BackLink className="justify-self-start" />

        <div
          role="toolbar"
          aria-label="Formato"
          className="col-span-2 row-start-2 flex flex-wrap items-center justify-center justify-self-center lg:col-span-1 lg:col-start-2 lg:row-start-1"
        >
          <ToolbarButton
            label="Negrita"
            active={format.bold}
            onPress={() => runCommand('bold')}
          >
            <BoldIcon className="size-5" />
          </ToolbarButton>
          <ToolbarButton
            label="Cursiva"
            active={format.italic}
            onPress={() => runCommand('italic')}
          >
            <ItalicIcon className="size-5" />
          </ToolbarButton>
          <ToolbarButton
            label="Subrayado"
            active={format.underline}
            onPress={() => runCommand('underline')}
          >
            <UnderlineIcon className="size-5" />
          </ToolbarButton>

          <Divider />

          {(Object.keys(ALIGN_COMMANDS) as Align[]).map((align) => (
            <ToolbarButton
              key={align}
              label={ALIGN_LABELS[align]}
              active={format.align === align}
              onPress={() => runCommand(ALIGN_COMMANDS[align])}
            >
              <AlignIcon align={align} className="size-5" />
            </ToolbarButton>
          ))}

          <Divider />

          <div className="flex h-8 items-center gap-1 px-1 sm:h-9 sm:gap-2 sm:px-2">
            <span
              aria-hidden
              className="font-display text-ink-muted block text-sm leading-none font-semibold tracking-tight"
            >
              Aa
            </span>
            <label className="sr-only" htmlFor="editor-font-size">
              Tamaño de fuente
            </label>
            <input
              id="editor-font-size"
              type="range"
              min={0}
              max={FONT_SIZE_STEPS.length - 1}
              step={1}
              value={fontSizeIndex}
              onChange={(e) =>
                changeFontSize(Number.parseInt(e.target.value, 10))
              }
              className="accent-foxglove h-1.5 w-12 cursor-pointer touch-manipulation sm:w-24"
            />
          </div>

          <Divider />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => void copyAll()}
            aria-label="Copiar texto"
            className="text-ink-muted hover:bg-ink/5 hover:text-ink font-reading flex h-8 items-center gap-1.5 rounded-sm px-1.5 text-sm tracking-wide transition sm:h-9 sm:px-2"
          >
            {copied ? (
              <CheckIcon className="text-foxglove size-5" />
            ) : (
              <ClipboardDocumentIcon className="size-5" />
            )}
            <span className="hidden sm:inline">
              {copied ? 'Copiado' : 'Copiar'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1 justify-self-end lg:col-start-3">
          <RepeatedWordsMenu
            words={repeatedWords}
            selectedWord={selectedWord}
            onSelect={selectWord}
          />
          <SymbolsMenu />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => void toggleFullscreen()}
            aria-label={
              isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'
            }
            title={
              isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'
            }
            className="text-ink-muted hover:bg-ink/5 hover:text-ink hidden size-9 items-center justify-center rounded-sm transition md:flex"
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="size-5" />
            ) : (
              <ArrowsPointingOutIcon className="size-5" />
            )}
          </button>
          <ThemeToggle className="text-ink-muted hover:bg-ink/5 hover:text-ink size-9" iconClassName="size-5" />
        </div>
      </header>

      <div
        className="min-h-0 flex-1 cursor-text overflow-y-auto"
        onMouseDown={focusAtEnd}
      >
        <div
          className="flex min-h-full w-full flex-col pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] sm:px-8"
          onMouseDown={focusAtEnd}
        >
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Texto"
            onInput={handleInput}
            onCopy={handleCopy}
            onCut={handleCopy}
            className="font-reading text-ink caret-foxglove flex-1 pt-6 pb-12 break-words whitespace-pre-wrap outline-none sm:pt-10 sm:pb-14"
            style={{ fontSize: `${fontSizeRem}rem`, lineHeight: 1.7 }}
          />
        </div>
      </div>

      <p
        className="bg-surface/85 text-ink-muted font-reading pointer-events-none absolute right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] rounded-sm px-2 py-1 text-xs tracking-wide tabular-nums backdrop-blur-sm"
      >
        {stats.words.toLocaleString('es')}{' '}
        {stats.words === 1 ? 'palabra' : 'palabras'} ·{' '}
        {stats.characters.toLocaleString('es')}{' '}
        {stats.characters === 1 ? 'carácter' : 'caracteres'}
      </p>
    </main>
  )
}
