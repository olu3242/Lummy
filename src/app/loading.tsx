import { LummyLoader } from "@/components/ui/lummy-loader"

export default function AppLoading() {
  return (
    <LummyLoader
      mode="fullscreen"
      text="Launching your creator OS..."
      subtext="Syncing your workspace and storefront."
    />
  )
}
