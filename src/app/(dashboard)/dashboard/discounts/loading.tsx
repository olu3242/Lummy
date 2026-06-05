import { LummyLoader } from "@/components/branding/lummy-loader"

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LummyLoader context="products" label="Loading discounts…" size="md" />
    </div>
  )
}
