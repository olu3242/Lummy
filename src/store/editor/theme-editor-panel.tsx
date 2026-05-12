"use client"

import { STORE_PRESETS } from "../themes/presets"
import type { StorePreset, ThemeTokens } from "../schema/types"
import { cn } from "@/lib/utils"

const ACCENT_COLORS = [
  { value: "#6C4EF3", label: "Purple" },
  { value: "#F97316", label: "Coral" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#F43F5E", label: "Rose" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#111111", label: "Ink" },
  { value: "#8B5CF6", label: "Violet" },
]

const FONTS: { value: ThemeTokens["font"]; label: string }[] = [
  { value: "inter", label: "Inter" },
  { value: "poppins", label: "Poppins" },
  { value: "playfair", label: "Playfair" },
  { value: "mono", label: "Mono" },
]

const LAYOUTS: { value: ThemeTokens["layout"]; label: string }[] = [
  { value: "grid-2", label: "2 cols" },
  { value: "grid-3", label: "3 cols" },
  { value: "list", label: "List" },
]

const RADII: { value: ThemeTokens["radius"]; label: string }[] = [
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
  { value: "xl", label: "XL" },
  { value: "full", label: "○" },
]

const SHADOWS: { value: ThemeTokens["shadow"]; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "Soft" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Heavy" },
]

const BUTTON_STYLES: { value: ThemeTokens["buttonStyle"]; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "pill", label: "Pill" },
  { value: "sharp", label: "Sharp" },
]

interface ThemeEditorPanelProps {
  theme: ThemeTokens
  onUpdateTheme: (patch: Partial<ThemeTokens>) => void
  onApplyPreset: (preset: StorePreset) => void
}

export function ThemeEditorPanel({ theme, onUpdateTheme, onApplyPreset }: ThemeEditorPanelProps) {
  return (
    <div className="space-y-5 px-1">
      {/* Presets */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-2">Presets</p>
        <div className="grid grid-cols-3 gap-2">
          {STORE_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-border hover:border-foreground/20 transition-colors group"
            >
              <div className="h-6 w-6 rounded-full" style={{ backgroundColor: preset.preview }} />
              <span className="text-[10px] font-medium opacity-70 group-hover:opacity-100">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-2">Accent Color</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {ACCENT_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => onUpdateTheme({ accent: c.value })}
              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c.value,
                borderColor: theme.accent === c.value ? c.value : "transparent",
                boxShadow: theme.accent === c.value ? `0 0 0 2px white, 0 0 0 4px ${c.value}` : "none",
              }}
              title={c.label}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme.accent}
            onChange={e => onUpdateTheme({ accent: e.target.value })}
            className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
          />
          <input
            type="text"
            value={theme.accent}
            onChange={e => {
              const v = e.target.value
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onUpdateTheme({ accent: v })
            }}
            className="flex-1 h-7 px-2 text-xs rounded-lg border border-border bg-background font-mono"
          />
        </div>
      </div>

      {/* Font */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-2">Font</p>
        <div className="grid grid-cols-2 gap-1.5">
          {FONTS.map(f => (
            <button
              key={f.value}
              onClick={() => onUpdateTheme({ font: f.value })}
              className={cn(
                "h-8 px-3 rounded-lg border text-xs font-medium transition-all",
                theme.font === f.value
                  ? "border-foreground/30 bg-foreground/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/20"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-2">Product Layout</p>
        <div className="flex gap-1.5">
          {LAYOUTS.map(l => (
            <button
              key={l.value}
              onClick={() => onUpdateTheme({ layout: l.value })}
              className={cn(
                "flex-1 h-8 rounded-lg border text-xs font-medium transition-all",
                theme.layout === l.value
                  ? "border-foreground/30 bg-foreground/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/20"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Radius */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-2">Corner Radius</p>
        <div className="flex gap-1.5">
          {RADII.map(r => (
            <button
              key={r.value}
              onClick={() => onUpdateTheme({ radius: r.value })}
              className={cn(
                "flex-1 h-8 border text-xs font-bold transition-all",
                theme.radius === r.value
                  ? "border-foreground/30 bg-foreground/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/20"
              )}
              style={{
                borderRadius:
                  r.value === "sm" ? "4px"
                  : r.value === "md" ? "8px"
                  : r.value === "lg" ? "12px"
                  : r.value === "xl" ? "16px"
                  : "9999px",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shadow */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-2">Shadow</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SHADOWS.map(s => (
            <button
              key={s.value}
              onClick={() => onUpdateTheme({ shadow: s.value })}
              className={cn(
                "h-8 rounded-lg border text-xs font-medium transition-all",
                theme.shadow === s.value
                  ? "border-foreground/30 bg-foreground/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/20"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Button Style */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-2">Button Style</p>
        <div className="flex gap-1.5">
          {BUTTON_STYLES.map(b => (
            <button
              key={b.value}
              onClick={() => onUpdateTheme({ buttonStyle: b.value })}
              className={cn(
                "flex-1 h-8 border text-xs font-medium transition-all",
                theme.buttonStyle === b.value
                  ? "border-foreground/30 bg-foreground/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/20"
              )}
              style={{
                borderRadius: b.value === "pill" ? "9999px" : b.value === "sharp" ? "2px" : "8px",
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
