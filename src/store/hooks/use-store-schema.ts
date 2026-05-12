"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import type {
  StoreSchema, StoreSection, SectionType, ThemeTokens,
  AnnouncementSettings, SEOSettings, StoreHoursSettings,
} from "../schema/types"
import { DEFAULT_SCHEMA, SECTION_DEFAULTS } from "../schema/defaults"
import { migrateToStoreSchema } from "../schema/migrate"
import type { StorePreset } from "../schema/types"

const SCHEMA_KEY = "lummy_store_schema_v2"
const OLD_KEY = "lummy_store_settings"

function loadSchema(): StoreSchema {
  if (typeof window === "undefined") return DEFAULT_SCHEMA
  try {
    const newRaw = localStorage.getItem(SCHEMA_KEY)
    if (newRaw) return migrateToStoreSchema(JSON.parse(newRaw))
    const oldRaw = localStorage.getItem(OLD_KEY)
    if (oldRaw) return migrateToStoreSchema(JSON.parse(oldRaw))
  } catch {}
  return DEFAULT_SCHEMA
}

let idCounter = 0
function genId(): string {
  return `s-${Date.now()}-${++idCounter}`
}

export function useStoreSchema() {
  const [schema, setSchema] = useState<StoreSchema>(DEFAULT_SCHEMA)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSchema(loadSchema())
    setHydrated(true)
  }, [])

  const updateTheme = useCallback((patch: Partial<ThemeTokens>) => {
    setSchema(s => ({ ...s, theme: { ...s.theme, ...patch } }))
  }, [])

  const applyPreset = useCallback((preset: StorePreset) => {
    setSchema(s => ({ ...s, theme: { ...preset.theme } }))
  }, [])

  const toggleSection = useCallback((id: string) => {
    setSchema(s => ({
      ...s,
      sections: s.sections.map(sec =>
        sec.id === id ? { ...sec, enabled: !sec.enabled } : sec
      ),
    }))
  }, [])

  const updateSection = useCallback((id: string, patch: Partial<StoreSection>) => {
    setSchema(s => ({
      ...s,
      sections: s.sections.map(sec => sec.id === id ? { ...sec, ...patch } : sec),
    }))
  }, [])

  const reorderSections = useCallback((reordered: StoreSection[]) => {
    setSchema(s => ({
      ...s,
      sections: reordered.map((sec, i) => ({ ...sec, order: i })),
    }))
  }, [])

  const addSection = useCallback((type: SectionType) => {
    const defaults = SECTION_DEFAULTS[type]
    const maxOrder = schema.sections.reduce((m, s) => Math.max(m, s.order), -1)
    const newSection: StoreSection = {
      ...defaults,
      id: genId(),
      order: maxOrder + 1,
    }
    setSchema(s => ({ ...s, sections: [...s.sections, newSection] }))
  }, [schema.sections])

  const removeSection = useCallback((id: string) => {
    setSchema(s => ({
      ...s,
      sections: s.sections.filter(sec => sec.id !== id),
    }))
  }, [])

  const updateAnnouncement = useCallback((patch: Partial<AnnouncementSettings>) => {
    setSchema(s => ({ ...s, announcement: { ...s.announcement, ...patch } }))
  }, [])

  const updateSEO = useCallback((patch: Partial<SEOSettings>) => {
    setSchema(s => ({ ...s, seo: { ...s.seo, ...patch } }))
  }, [])

  const updateHours = useCallback((patch: Partial<StoreHoursSettings>) => {
    setSchema(s => ({ ...s, hours: { ...s.hours, ...patch } }))
  }, [])

  const save = useCallback(() => {
    try {
      localStorage.setItem(SCHEMA_KEY, JSON.stringify(schema))
      toast({ title: "Store saved!", description: "Your changes are live.", variant: "success" })
    } catch {
      toast({ title: "Save failed", description: "Could not save changes.", variant: "error" })
    }
  }, [schema])

  const reset = useCallback(() => {
    setSchema(DEFAULT_SCHEMA)
    toast({ title: "Reset complete", description: "Store reset to defaults." })
  }, [])

  const activeSections = useMemo(
    () => schema.sections.filter(s => s.enabled).sort((a, b) => a.order - b.order),
    [schema.sections]
  )

  const sortedSections = useMemo(
    () => [...schema.sections].sort((a, b) => a.order - b.order),
    [schema.sections]
  )

  return {
    schema,
    hydrated,
    activeSections,
    sortedSections,
    updateTheme,
    applyPreset,
    toggleSection,
    updateSection,
    reorderSections,
    addSection,
    removeSection,
    updateAnnouncement,
    updateSEO,
    updateHours,
    save,
    reset,
  }
}
