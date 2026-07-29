import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/read')({ component: ReadRedirect })

/** Legacy path — home resumes the reader from stored text. */
function ReadRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    void navigate({ to: '/', replace: true })
  }, [navigate])

  return <div className="bg-surface min-h-dvh" />
}
