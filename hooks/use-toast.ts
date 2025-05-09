"use client"

// Simple toast hook for notifications
import { useState } from "react"

type ToastVariant = "default" | "destructive" | "success"

interface ToastProps {
  title: string
  description: string
  variant?: ToastVariant
}

// Global toast state
let toastQueue: ToastProps[] = []
let listeners: Function[] = []

// Notify all listeners when toast queue changes
const notifyListeners = () => {
  listeners.forEach((listener) => listener(toastQueue))
}

export function toast(props: ToastProps) {
  // Add toast to queue
  toastQueue = [...toastQueue, props]

  // Notify listeners
  notifyListeners()

  // Auto-remove toast after 3 seconds
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t !== props)
    notifyListeners()
  }, 3000)
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>(toastQueue)

  // Register listener
  useState(() => {
    const listener = (queue: ToastProps[]) => {
      setToasts([...queue])
    }

    listeners.push(listener)

    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  })

  return {
    toasts,
    toast,
  }
}
