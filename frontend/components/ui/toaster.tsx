"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

const variantConfig = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    accentColor: "bg-emerald-500",
  },
  destructive: {
    icon: XCircle,
    iconColor: "text-red-500",
    accentColor: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    accentColor: "bg-amber-500",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    accentColor: "bg-blue-500",
  },
  default: {
    icon: Info,
    iconColor: "text-slate-400",
    accentColor: "bg-slate-400",
  },
} as const

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={3000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const config = variantConfig[variant || "default"]
        const Icon = config.icon

        return (
          <Toast key={id} variant={variant} {...props}>
            {/* Colored accent bar on the left */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${config.accentColor}`} />

            <div className="flex items-center gap-3 py-3 pl-4 pr-8 w-full">
              <div className={`flex-shrink-0 ${config.iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
