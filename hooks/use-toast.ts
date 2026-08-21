'use client'

import { toastManager } from '@/components/ui/toast'

type ToastVariant = 'default' | 'destructive'

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
}

function mapVariantToType(variant?: ToastVariant): 'error' | undefined {
  if (variant === 'destructive') return 'error'
  return undefined
}

function toast({ title, description, variant }: ToastOptions) {
  const id = toastManager.add({
    title,
    description,
    type: mapVariantToType(variant),
  })

  return {
    id,
    dismiss: () => toastManager.close(id),
    update: (options: ToastOptions) => {
      toastManager.update(id, {
        title: options.title,
        description: options.description,
        type: mapVariantToType(options.variant),
      })
    },
  }
}

function dismiss(toastId?: string) {
  if (toastId) {
    toastManager.close(toastId)
  }
}

function useToast() {
  return {
    toasts: [] as never[],
    toast,
    dismiss,
  }
}

export { useToast, toast }
