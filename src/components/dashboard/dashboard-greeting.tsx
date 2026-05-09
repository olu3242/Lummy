"use client"

import * as React from "react"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export function DashboardGreeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = React.useState("Good morning")

  React.useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  return (
    <h1 className="font-display text-2xl font-extrabold">
      {greeting}, {firstName} 👋
    </h1>
  )
}
