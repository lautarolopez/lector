import { useLayoutEffect, useState, type RefObject } from 'react'
import { paginateText } from '#/lib/paginate'

type Options = {
  text: string
  containerRef: RefObject<HTMLElement | null>
  measureRef: RefObject<HTMLElement | null>
}

export function useTextPages({ text, containerRef, measureRef }: Options) {
  const [pages, setPages] = useState<string[]>([text])
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    const compute = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (width <= 0 || height <= 0) return

      measure.style.width = `${width}px`
      // Allow the measure node to grow; we compare scrollHeight to page height
      measure.style.height = 'auto'

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
  }, [text, containerRef, measureRef])

  return { pages, ready }
}
