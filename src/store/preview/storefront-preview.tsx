"use client"

import * as React from "react"
import { StorefrontRenderer } from "../renderer/storefront-renderer"
import { ViewportToggle, type Viewport } from "./viewport-toggle"
import type { StoreSchema, StorefrontCreator } from "../schema/types"

const VIEWPORT_WIDTHS: Record<Viewport, number> = {
  mobile: 390,
  tablet: 768,
  desktop: 1200,
}

interface StorefrontPreviewProps {
  schema: StoreSchema
  creator: StorefrontCreator
}

export function StorefrontPreview({ schema, creator }: StorefrontPreviewProps) {
  const [viewport, setViewport] = React.useState<Viewport>("mobile")
  const outerRef = React.useRef<HTMLDivElement>(null)
  const innerRef = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(1)
  const [innerHeight, setInnerHeight] = React.useState<number | null>(null)

  React.useEffect(() => {
    const outer = outerRef.current
    if (!outer) return
    const obs = new ResizeObserver(([entry]) => {
      const containerWidth = entry.contentRect.width
      if (containerWidth > 0) {
        setScale(containerWidth / VIEWPORT_WIDTHS[viewport])
      }
    })
    obs.observe(outer)
    return () => obs.disconnect()
  }, [viewport])

  // Track inner content height to size outer container properly
  React.useEffect(() => {
    const inner = innerRef.current
    if (!inner) return
    const obs = new ResizeObserver(() => {
      setInnerHeight(inner.scrollHeight)
    })
    obs.observe(inner)
    return () => obs.disconnect()
  }, [])

  const outerHeight = innerHeight ? innerHeight * scale : 600

  return (
    <div className="flex flex-col h-full gap-3">
      <ViewportToggle viewport={viewport} onChange={setViewport} />

      <div
        ref={outerRef}
        className="relative overflow-hidden rounded-2xl border border-border bg-background flex-1"
        style={{ minHeight: 400, maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}
      >
        <div
          style={{
            width: VIEWPORT_WIDTHS[viewport],
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            minHeight: "100%",
          }}
        >
          <div ref={innerRef} className="bg-background min-h-screen">
            <StorefrontRenderer schema={schema} creator={creator} />
          </div>
        </div>
      </div>
    </div>
  )
}
