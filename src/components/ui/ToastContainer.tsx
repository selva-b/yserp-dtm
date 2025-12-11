'use client'

import Toast, { type ToastProps } from './Toast'

interface ToastContainerProps {
  toasts: Omit<ToastProps, 'onClose'>[]
  onClose: (id: string) => void
}

/**
 * Toast Container Component
 *
 * Renders all active toasts in a fixed position container.
 *
 * Position: Top-right corner
 * Max visible: 5 toasts (older ones auto-dismissed)
 * Z-index: 9999 (above modals/drawers)
 */
export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.slice(0, 5).map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}
