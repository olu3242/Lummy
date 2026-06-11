"use client"

import * as React from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("[app/global-error]", {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    })
  }, [error])

  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "sans-serif" }}>
          <section style={{ maxWidth: 360, textAlign: "center" }}>
            <h1>Something went wrong</h1>
            <p>Refresh the page or try again in a moment.</p>
            {error.digest ? <p style={{ fontFamily: "monospace", fontSize: 12 }}>Error ID: {error.digest}</p> : null}
            <button onClick={reset} style={{ marginTop: 16, padding: "8px 14px", cursor: "pointer" }}>
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
