"use client"

import { Reorder, useDragControls } from "framer-motion"
import {
  GripVertical, Eye, EyeOff, Settings2, Trash2,
  Megaphone, Sparkles, User, ShoppingBag, Star,
  MessageSquare, Image, MessageCircle, HelpCircle, Link2,
  Plus,
} from "lucide-react"
import type { StoreSection, SectionType } from "../schema/types"
import { cn } from "@/lib/utils"

const ICON_COMPONENTS: Record<string, React.ElementType> = {
  Megaphone, Sparkles, User, ShoppingBag, Star,
  MessageSquare, Image, MessageCircle, HelpCircle, Link2, Settings2,
}

interface SectionListEditorProps {
  sections: StoreSection[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onReorder: (sections: StoreSection[]) => void
  onAdd: () => void
}

function SectionItem({
  section,
  isSelected,
  onSelect,
  onToggle,
  onRemove,
}: {
  section: StoreSection
  isSelected: boolean
  onSelect: () => void
  onToggle: () => void
  onRemove: () => void
}) {
  const controls = useDragControls()
  const Icon = ICON_COMPONENTS[section.iconKey] ?? Settings2

  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all group cursor-pointer select-none",
        isSelected
          ? "border-foreground/20 bg-foreground/5"
          : "border-border hover:border-foreground/10 hover:bg-accent/50",
        !section.enabled && "opacity-50"
      )}
    >
      {/* Drag handle */}
      <button
        onPointerDown={e => controls.start(e)}
        className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Icon + label */}
      <button
        onClick={onSelect}
        className="flex items-center gap-2 flex-1 min-w-0"
      >
        <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium truncate">{section.label}</span>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onToggle() }}
          className="p-1.5 rounded-lg hover:bg-background transition-colors"
          title={section.enabled ? "Hide section" : "Show section"}
        >
          {section.enabled
            ? <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          }
        </button>
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
          title="Remove section"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </Reorder.Item>
  )
}

export function SectionListEditor({
  sections,
  selectedId,
  onSelect,
  onToggle,
  onRemove,
  onReorder,
  onAdd,
}: SectionListEditorProps) {
  return (
    <div className="space-y-1.5">
      <Reorder.Group
        axis="y"
        values={sections}
        onReorder={onReorder}
        className="space-y-1.5"
      >
        {sections.map(section => (
          <SectionItem
            key={section.id}
            section={section}
            isSelected={selectedId === section.id}
            onSelect={() => onSelect(section.id)}
            onToggle={() => onToggle(section.id)}
            onRemove={() => onRemove(section.id)}
          />
        ))}
      </Reorder.Group>

      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors mt-2"
      >
        <Plus className="h-3.5 w-3.5" />
        Add section
      </button>
    </div>
  )
}
