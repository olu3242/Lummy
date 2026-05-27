"use client"

import { useState, useCallback } from "react"

interface UploadOptions {
  type?: "avatar" | "banner" | "product"
  productId?: string
  onSuccess?: (url: string) => void
  onError?: (message: string) => void
}

interface UploadState {
  uploading: boolean
  progress: number | null
  error: string | null
}

export function useUpload(options: UploadOptions = {}) {
  const [state, setState] = useState<UploadState>({ uploading: false, progress: null, error: null })

  const upload = useCallback(async (file: File): Promise<string | null> => {
    if (file.size > 10 * 1024 * 1024) {
      const msg = "File too large (max 10 MB)"
      setState({ uploading: false, progress: null, error: msg })
      options.onError?.(msg)
      return null
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      const msg = "Only JPG, PNG, WebP, or GIF files allowed"
      setState({ uploading: false, progress: null, error: msg })
      options.onError?.(msg)
      return null
    }

    setState({ uploading: true, progress: 0, error: null })

    const formData = new FormData()
    formData.append("file", file)
    if (options.type) formData.append("type", options.type)
    if (options.productId) formData.append("productId", options.productId)

    try {
      setState(s => ({ ...s, progress: 30 }))
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      setState(s => ({ ...s, progress: 80 }))

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }))
        throw new Error(err.error ?? "Upload failed")
      }

      const data = await res.json() as { url: string }
      setState({ uploading: false, progress: null, error: null })
      options.onSuccess?.(data.url)
      return data.url
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed"
      setState({ uploading: false, progress: null, error: msg })
      options.onError?.(msg)
      return null
    }
  }, [options])

  const reset = useCallback(() => {
    setState({ uploading: false, progress: null, error: null })
  }, [])

  return { upload, reset, ...state }
}
