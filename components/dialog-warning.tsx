import type React from "react"

interface DialogWarningProps {
  message?: string
  className?: string
}

export const DialogWarning: React.FC<DialogWarningProps> = ({
  message = "El mal uso de esta solicitud puede ser motivo de multa.",
  className = "",
}) => {
  return <div className={`mt-4 text-xs text-red-600 font-medium ${className}`}>{message}</div>
}
