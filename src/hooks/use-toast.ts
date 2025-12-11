'use client'

import { create } from 'zustand'
import type { ToastType } from '@/components/ui/Toast'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

/**
 * Toast Store (Zustand)
 *
 * Global state management for toast notifications.
 * Accessible from anywhere in the app.
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },

  clearAll: () => {
    set({ toasts: [] })
  },
}))

/**
 * Toast Hook
 *
 * Provides convenient methods to show toasts from any component.
 *
 * Usage:
 * ```tsx
 * const toast = useToast()
 *
 * toast.success('Task created successfully!')
 * toast.error('Failed to delete task')
 * toast.warning('This action cannot be undone')
 * toast.info('Task assigned to John Doe')
 * ```
 */
export function useToast() {
  const addToast = useToastStore((state) => state.addToast)

  return {
    success: (message: string, duration?: number) => {
      addToast({ type: 'success', message, duration })
    },

    error: (message: string, duration?: number) => {
      addToast({ type: 'error', message, duration })
    },

    warning: (message: string, duration?: number) => {
      addToast({ type: 'warning', message, duration })
    },

    info: (message: string, duration?: number) => {
      addToast({ type: 'info', message, duration })
    },
  }
}
