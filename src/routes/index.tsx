import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { Reader } from '#/components/reader'
import { ThemeToggle } from '#/components/theme-toggle'
import { clearReading, loadText, savePage, saveText } from '#/lib/text-store'

export const Route = createFileRoute('/')({ component: Home })

type Phase = 'landing' | 'leaving' | 'reading' | 'returning'

function Home() {
  const [text, setText] = useState('')
  const [readingText, setReadingText] = useState('')
  const [phase, setPhase] = useState<Phase>('landing')

  useEffect(() => {
    const stored = loadText()
    if (stored && stored.trim().length > 0) {
      setReadingText(stored)
      setText(stored)
      setPhase('reading')
    }
  }, [])

  const canGo = text.trim().length > 0
  const showLanding = phase === 'landing' || phase === 'leaving'
  const showReader = phase === 'reading' || phase === 'returning'

  function handleGo(e: FormEvent) {
    e.preventDefault()
    if (!canGo || phase !== 'landing') return
    saveText(text)
    savePage(0)
    setReadingText(text)
    setPhase('leaving')
  }

  function handleExitReader() {
    if (phase !== 'reading') return
    setPhase('returning')
  }

  return (
    <main className="bg-surface text-ink relative min-h-dvh overflow-hidden">
      {!showReader ? (
        <div className="absolute top-3 right-3 z-30 sm:top-4 sm:right-4">
          <ThemeToggle />
        </div>
      ) : null}

      {showLanding ? (
        <div
          className={`flex min-h-dvh flex-col ${
            phase === 'leaving' ? 'animate-scene-out' : ''
          }`}
          onAnimationEnd={(e) => {
            if (e.target !== e.currentTarget) return
            if (phase === 'leaving') setPhase('reading')
          }}
        >
          <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16 sm:px-8">
            <h1 className="animate-fade-rise font-display text-3xl leading-none font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Arrancá a leer
            </h1>
            <p className="animate-fade-rise-delay font-reading text-ink-muted mt-5 max-w-md text-lg">
              Pegá cualquier texto y convertilo en una lectura paginada — sin
              scroll infinito.
            </p>

            <form
              onSubmit={handleGo}
              className="animate-fade-rise-delay-2 mt-10 flex flex-col gap-4"
            >
              <label htmlFor="paste" className="sr-only">
                Tu texto
              </label>
              <textarea
                id="paste"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Pegá el texto acá"
                spellCheck={false}
                disabled={phase !== 'landing'}
                className="border-border bg-panel text-ink placeholder:text-ink-muted/70 font-reading focus:border-foxglove/60 focus:ring-foxglove/40 min-h-56 w-full resize-y rounded-sm border px-4 py-3 text-base leading-relaxed outline-none transition focus:ring-1 disabled:opacity-100"
              />
              <div className="flex items-center justify-end gap-4">
                <button
                  type="submit"
                  disabled={!canGo || phase !== 'landing'}
                  className="font-display bg-cta text-cta-fg hover:bg-foxglove disabled:bg-cta-disabled disabled:text-cta-disabled-fg rounded-sm px-6 py-2.5 text-base font-semibold tracking-wide transition enabled:cursor-pointer disabled:cursor-not-allowed"
                >
                  Comenzar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showReader ? (
        <div
          className={`absolute inset-0 ${
            phase === 'returning' ? 'animate-scene-out' : 'animate-scene-in'
          }`}
          onAnimationEnd={(e) => {
            if (e.target !== e.currentTarget) return
            if (phase === 'returning') {
              clearReading()
              setReadingText('')
              setPhase('landing')
            }
          }}
        >
          <Reader text={readingText} onExit={handleExitReader} />
        </div>
      ) : null}
    </main>
  )
}
