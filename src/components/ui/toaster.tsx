"use client"

import { useToast } from "@/hooks/use-toast"
import { Toast, ToastProvider, ToastViewport } from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, title, description, variant, open }) => (
        <Toast key={id} open={open} variant={variant} title={title} description={description} />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
