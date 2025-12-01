"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toastIconMap,
  toastIconColorMap,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const variantKey = variant || "default"
        const Icon = toastIconMap[variantKey as keyof typeof toastIconMap]
        const iconColor = toastIconColorMap[variantKey as keyof typeof toastIconColorMap]

        return (
          <Toast key={id} variant={variant} {...props}>
            {Icon && (
              <div className="flex-shrink-0">
                <Icon className={cn("h-5 w-5", iconColor)} />
              </div>
            )}
            <div className="flex-1 grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
