'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin dashboard error:', error)
  }, [error])

  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-2 bg-background px-6 py-12 text-center sm:px-12">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-lg text-muted-foreground">
        We hit a snag while loading the admin dashboard. Please try again or contact support if the
        problem persists.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Try Again
      </button>
    </div>
  )
}
