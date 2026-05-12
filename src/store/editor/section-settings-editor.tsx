"use client"

import type {
  StoreSection, HeroSettings, ProductGridSettings,
  FeaturedCollectionSettings, TestimonialsSettings, CTASettings,
  FAQSettings, CreatorBioSettings, SocialLinksSettings, GallerySettings,
  AnnouncementSettings, FAQItem,
} from "../schema/types"
import { Plus, Trash2 } from "lucide-react"

interface SectionSettingsEditorProps {
  section: StoreSection
  onUpdate: (patch: Partial<StoreSection>) => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider opacity-50">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full h-8 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground/20"
    />
  )
}

function Select<T extends string>({ value, options, onChange }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as T)}
      className="w-full h-8 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition-colors ${value ? "bg-foreground" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </label>
  )
}

function updateSettings(section: StoreSection, patch: Record<string, unknown>, onUpdate: (p: Partial<StoreSection>) => void) {
  onUpdate({ settings: { ...section.settings, ...patch } })
}

function HeroEditor({ section, onUpdate }: SectionSettingsEditorProps) {
  const s = section.settings as unknown as HeroSettings
  const upd = (patch: Partial<HeroSettings>) => updateSettings(section, patch as Record<string, unknown>, onUpdate)
  return (
    <div className="space-y-3">
      <Field label="Headline">
        <TextInput value={s.headline ?? ""} onChange={v => upd({ headline: v })} placeholder="Your tagline" />
      </Field>
      <Field label="Subheadline">
        <TextInput value={s.subheadline ?? ""} onChange={v => upd({ subheadline: v })} placeholder="Supporting text" />
      </Field>
      <Field label="CTA Label">
        <TextInput value={s.ctaLabel ?? ""} onChange={v => upd({ ctaLabel: v })} placeholder="Shop Now" />
      </Field>
      <Field label="Layout">
        <Select value={s.layout ?? "centered"} onChange={v => upd({ layout: v })} options={[
          { value: "centered", label: "Centered" },
          { value: "split-left", label: "Split Left" },
          { value: "split-right", label: "Split Right" },
        ]} />
      </Field>
      <Field label="Background">
        <Select value={s.backgroundStyle ?? "gradient"} onChange={v => upd({ backgroundStyle: v })} options={[
          { value: "gradient", label: "Gradient" },
          { value: "solid", label: "Solid" },
        ]} />
      </Field>
      <Toggle value={s.showStats ?? true} onChange={v => upd({ showStats: v })} label="Show stats row" />
    </div>
  )
}

function ProductGridEditor({ section, onUpdate }: SectionSettingsEditorProps) {
  const s = section.settings as unknown as ProductGridSettings
  const upd = (patch: Partial<ProductGridSettings>) => updateSettings(section, patch as Record<string, unknown>, onUpdate)
  return (
    <div className="space-y-3">
      <Field label="Section Title">
        <TextInput value={s.title ?? ""} onChange={v => upd({ title: v })} placeholder="Products" />
      </Field>
      <Field label="Max Products">
        <Select value={String(s.maxProducts ?? 12) as "6" | "12" | "18" | "24"} onChange={v => upd({ maxProducts: parseInt(v) })} options={[
          { value: "6", label: "6 products" },
          { value: "12", label: "12 products" },
          { value: "18", label: "18 products" },
          { value: "24", label: "24 products" },
        ]} />
      </Field>
      <Toggle value={s.showSearch ?? true} onChange={v => upd({ showSearch: v })} label="Show search bar" />
      <Toggle value={s.showFilter ?? true} onChange={v => upd({ showFilter: v })} label="Show category filter" />
      <Toggle value={s.showStock ?? true} onChange={v => upd({ showStock: v })} label="Show stock badges" />
    </div>
  )
}

function FeaturedEditor({ section, onUpdate }: SectionSettingsEditorProps) {
  const s = section.settings as unknown as FeaturedCollectionSettings
  const upd = (patch: Partial<FeaturedCollectionSettings>) => updateSettings(section, patch as Record<string, unknown>, onUpdate)
  return (
    <div className="space-y-3">
      <Field label="Title">
        <TextInput value={s.title ?? ""} onChange={v => upd({ title: v })} placeholder="Featured Picks" />
      </Field>
      <Field label="Subtitle">
        <TextInput value={s.subtitle ?? ""} onChange={v => upd({ subtitle: v })} placeholder="Hand-selected favourites" />
      </Field>
      <Field label="Max Products">
        <Select value={String(s.maxProducts ?? 4) as "2" | "3" | "4"} onChange={v => upd({ maxProducts: parseInt(v) })} options={[
          { value: "2", label: "2 products" },
          { value: "3", label: "3 products" },
          { value: "4", label: "4 products" },
        ]} />
      </Field>
    </div>
  )
}

function TestimonialsEditor({ section, onUpdate }: SectionSettingsEditorProps) {
  const s = section.settings as unknown as TestimonialsSettings
  const upd = (patch: Partial<TestimonialsSettings>) => updateSettings(section, patch as Record<string, unknown>, onUpdate)
  return (
    <div className="space-y-3">
      <Field label="Title">
        <TextInput value={s.title ?? ""} onChange={v => upd({ title: v })} />
      </Field>
      <Field label="Max Reviews">
        <Select value={String(s.maxCount ?? 4) as "2" | "3" | "4" | "6"} onChange={v => upd({ maxCount: parseInt(v) })} options={[
          { value: "2", label: "2 reviews" },
          { value: "3", label: "3 reviews" },
          { value: "4", label: "4 reviews" },
          { value: "6", label: "6 reviews" },
        ]} />
      </Field>
      <Field label="Layout">
        <Select value={s.layout ?? "grid"} onChange={v => upd({ layout: v })} options={[
          { value: "grid", label: "Grid" },
          { value: "list", label: "List" },
        ]} />
      </Field>
    </div>
  )
}

function CTAEditor({ section, onUpdate }: SectionSettingsEditorProps) {
  const s = section.settings as unknown as CTASettings
  const upd = (patch: Partial<CTASettings>) => updateSettings(section, patch as Record<string, unknown>, onUpdate)
  return (
    <div className="space-y-3">
      <Field label="Headline">
        <TextInput value={s.headline ?? ""} onChange={v => upd({ headline: v })} />
      </Field>
      <Field label="Subtext">
        <TextInput value={s.subtext ?? ""} onChange={v => upd({ subtext: v })} />
      </Field>
      <Field label="Button Label">
        <TextInput value={s.ctaLabel ?? ""} onChange={v => upd({ ctaLabel: v })} />
      </Field>
      <Field label="Style">
        <Select value={s.style ?? "accent"} onChange={v => upd({ style: v })} options={[
          { value: "accent", label: "Accent" },
          { value: "dark", label: "Dark" },
          { value: "minimal", label: "Minimal" },
        ]} />
      </Field>
    </div>
  )
}

function FAQEditor({ section, onUpdate }: SectionSettingsEditorProps) {
  const s = section.settings as unknown as FAQSettings
  const items: FAQItem[] = s.items ?? []
  const upd = (newItems: FAQItem[]) => updateSettings(section, { items: newItems }, onUpdate)

  return (
    <div className="space-y-3">
      <Field label="Title">
        <TextInput value={s.title ?? ""} onChange={v => updateSettings(section, { title: v }, onUpdate)} />
      </Field>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="space-y-1.5 p-3 rounded-lg bg-muted/40 border border-border">
            <TextInput
              value={item.q}
              onChange={v => {
                const next = [...items]
                next[i] = { ...item, q: v }
                upd(next)
              }}
              placeholder="Question"
            />
            <TextInput
              value={item.a}
              onChange={v => {
                const next = [...items]
                next[i] = { ...item, a: v }
                upd(next)
              }}
              placeholder="Answer"
            />
            <button
              onClick={() => upd(items.filter((_, idx) => idx !== i))}
              className="flex items-center gap-1 text-[10px] text-destructive hover:opacity-80"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => upd([...items, { q: "", a: "" }])}
          className="w-full h-8 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" /> Add question
        </button>
      </div>
    </div>
  )
}

function CreatorBioEditor({ section, onUpdate }: SectionSettingsEditorProps) {
  const s = section.settings as unknown as CreatorBioSettings
  const upd = (patch: Partial<CreatorBioSettings>) => updateSettings(section, patch as Record<string, unknown>, onUpdate)
  return (
    <div className="space-y-3">
      <Field label="Layout">
        <Select value={s.layout ?? "full"} onChange={v => upd({ layout: v })} options={[
          { value: "full", label: "Full" },
          { value: "compact", label: "Compact" },
        ]} />
      </Field>
      <Toggle value={s.showStats ?? true} onChange={v => upd({ showStats: v })} label="Show stats" />
      <Toggle value={s.showSocials ?? true} onChange={v => upd({ showSocials: v })} label="Show social links" />
      <Toggle value={s.showLocation ?? true} onChange={v => upd({ showLocation: v })} label="Show location" />
    </div>
  )
}

function SocialLinksEditor({ section, onUpdate }: SectionSettingsEditorProps) {
  const s = section.settings as unknown as SocialLinksSettings
  const upd = (patch: Partial<SocialLinksSettings>) => updateSettings(section, patch as Record<string, unknown>, onUpdate)
  return (
    <div className="space-y-3">
      <Field label="Section Title">
        <TextInput value={s.title ?? ""} onChange={v => upd({ title: v })} placeholder="Follow me" />
      </Field>
      <Toggle value={s.showLabels ?? true} onChange={v => upd({ showLabels: v })} label="Show handle labels" />
    </div>
  )
}

function GalleryEditor({ section, onUpdate }: SectionSettingsEditorProps) {
  const s = section.settings as unknown as GallerySettings
  const upd = (patch: Partial<GallerySettings>) => updateSettings(section, patch as Record<string, unknown>, onUpdate)
  return (
    <div className="space-y-3">
      <Field label="Title">
        <TextInput value={s.title ?? ""} onChange={v => upd({ title: v })} />
      </Field>
      <Field label="Max Images">
        <Select value={String(s.maxImages ?? 9) as "4" | "6" | "9" | "12"} onChange={v => upd({ maxImages: parseInt(v) })} options={[
          { value: "4", label: "4 images" },
          { value: "6", label: "6 images" },
          { value: "9", label: "9 images" },
          { value: "12", label: "12 images" },
        ]} />
      </Field>
      <Field label="Columns">
        <Select value={String(s.columns ?? 3) as "2" | "3" | "4"} onChange={v => upd({ columns: parseInt(v) as 2|3|4 })} options={[
          { value: "2", label: "2 columns" },
          { value: "3", label: "3 columns" },
          { value: "4", label: "4 columns" },
        ]} />
      </Field>
    </div>
  )
}

function AnnouncementEditor({ section, onUpdate }: SectionSettingsEditorProps) {
  const s = section.settings as unknown as AnnouncementSettings
  const upd = (patch: Partial<AnnouncementSettings>) => updateSettings(section, patch as Record<string, unknown>, onUpdate)
  return (
    <div className="space-y-3">
      <Toggle value={s.enabled ?? true} onChange={v => upd({ enabled: v })} label="Show announcement" />
      <Field label="Text">
        <TextInput value={s.text ?? ""} onChange={v => upd({ text: v })} placeholder="Announcement text" />
      </Field>
      <Field label="CTA Label">
        <TextInput value={s.ctaLabel ?? ""} onChange={v => upd({ ctaLabel: v })} placeholder="Shop Now" />
      </Field>
      <Field label="Style">
        <Select value={s.style ?? "purple"} onChange={v => upd({ style: v })} options={[
          { value: "purple", label: "Purple (Accent)" },
          { value: "coral", label: "Coral" },
          { value: "green", label: "Green" },
          { value: "amber", label: "Amber" },
        ]} />
      </Field>
    </div>
  )
}

const EDITORS: Partial<Record<string, React.ComponentType<SectionSettingsEditorProps>>> = {
  Hero: HeroEditor,
  ProductGrid: ProductGridEditor,
  FeaturedCollection: FeaturedEditor,
  Testimonials: TestimonialsEditor,
  CTA: CTAEditor,
  FAQ: FAQEditor,
  CreatorBio: CreatorBioEditor,
  SocialLinks: SocialLinksEditor,
  Gallery: GalleryEditor,
  AnnouncementBar: AnnouncementEditor,
}

export function SectionSettingsEditor({ section, onUpdate }: SectionSettingsEditorProps) {
  const Editor = EDITORS[section.type]
  if (!Editor) {
    return (
      <div className="text-xs text-muted-foreground py-4 text-center">
        No settings for this section.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold opacity-60">{section.label} Settings</p>
      <Editor section={section} onUpdate={onUpdate} />
    </div>
  )
}
