"use client"

interface MobileHeaderProps {
  isVigilante?: boolean
  userName?: string
}

export default function MobileHeader({ isVigilante = false, userName = "" }: MobileHeaderProps) {
  // Mantenemos la interfaz y la función para no romper las referencias existentes
  // pero no renderizamos nada
  return null
}
