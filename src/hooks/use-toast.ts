"use client"

import * as React from "react"
import type { ToastVariant } from "@/components/ui/toast"

export interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: string
  open: boolean
}

type ToastAction =
  | { type: "ADD"; toast: ToastItem }
  | { type: "UPDATE"; id: string; toast: Partial<ToastItem> }
  | { type: "DISMISS"; id: string }
  | { type: "REMOVE"; id: string }

let count = 0
function genId() { return `toast-${++count}` }

const listeners: Array<(state: ToastItem[]) => void> = []
let memoryState: ToastItem[] = []

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((l) => l(memoryState))
}

function reducer(state: ToastItem[], action: ToastAction): ToastItem[] {
  switch (action.type) {
    case "ADD":
      return [action.toast, ...state].slice(0, 5)
    case "UPDATE":
      return state.map((t) => t.id === action.id ? { ...t, ...action.toast } : t)
    case "DISMISS":
      return state.map((t) => t.id === action.id ? { ...t, open: false } : t)
    case "REMOVE":
      return state.filter((t) => t.id !== action.id)
    default:
      return state
  }
}

export function toast(options: ToastOptions) {
  const id = genId()
  const duration = options.duration ?? 4000

  dispatch({ type: "ADD", toast: { ...options, id, open: true } })

  const timer = setTimeout(() => {
    dispatch({ type: "DISMISS", id })
    setTimeout(() => dispatch({ type: "REMOVE", id }), 300)
  }, duration)

  return {
    id,
    dismiss: () => {
      clearTimeout(timer)
      dispatch({ type: "DISMISS", id })
      setTimeout(() => dispatch({ type: "REMOVE", id }), 300)
    },
  }
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>(memoryState)

  React.useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const idx = listeners.indexOf(setToasts)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return { toasts }
}
