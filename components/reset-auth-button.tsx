"use client"

import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function ResetAuthButton() {
  const { resetStore } = useAuthStore()
  const router = useRouter()

  const handleReset = () => {
    // Resetear el store a su estado inicial
    resetStore()

    // Eliminar el almacenamiento local
    if (typeof window !== "undefined") {
      localStorage.removeItem("arcos-auth-storage")
    }

    // Redirigir al login
    router.push("/login")
  }

  return (
    <Button onClick={handleReset} variant="destructive" className="mt-4">
      Resetear Autenticación
    </Button>
  )
}
