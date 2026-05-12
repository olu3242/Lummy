"use client"

import { SectionRenderer } from "./section-renderer"
import { getFontFamily } from "../themes/utils"
import type { StoreSchema, StorefrontCreator } from "../schema/types"

interface StorefrontRendererProps {
  schema: StoreSchema
  creator: StorefrontCreator
}

export function StorefrontRenderer({ schema, creator }: StorefrontRendererProps) {
  const sections = schema.sections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)

  return (
    <div style={{ fontFamily: getFontFamily(schema.theme.font) }}>
      {sections.map(section => (
        <SectionRenderer
          key={section.id}
          section={section}
          theme={schema.theme}
          creator={creator}
        />
      ))}
    </div>
  )
}
