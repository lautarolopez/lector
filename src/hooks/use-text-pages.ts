import { useLayoutEffect, useState, type RefObject } from 'react'
import { paginateText } from '#/lib/paginate'

type Options = {
  text: string
  containerRef: RefObject<HTMLElement | null>
  measureRef: RefObject<HTMLElement | null>
  /** Rem font size used for measurement — changing it reflows pages. */
  fontSizeRem: number
}

export function useTextPages({
  text,
  containerRef,
  measureRef,
  fontSizeRem,
}: Options) {
  const [pages, setPages] = useState<string[]>([text])
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    setReady(false)

    const compute = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (width <= 0 || height <= 0) return

      measure.style.width = `${width}px`
      measure.style.height = 'auto'
      measure.style.fontSize = `${fontSizeRem}rem`
      measure.style.lineHeight = '1.7'

      const fits = (slice: string) => {
        measure.textContent = slice
        return measure.scrollHeight <= height
      }

      setPages(paginateText(text, fits))
      setReady(true)
    }

    compute()

    const observer = new ResizeObserver(() => {
      compute()
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [text, containerRef, measureRef, fontSizeRem])

  return { pages, ready }
}
