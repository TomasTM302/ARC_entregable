"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import AuthGuard from "@/components/auth-guard"

export default function AdminTasksPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a la nueva página de tareas administrativas
    router.push("/admin/tareas-administrativas")
  }, [router])

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <div className="container mx-auto py-8 px-4 text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Redirigiendo...</h1>
          <p>Te estamos redirigiendo al nuevo panel de tareas administrativas.</p>
        </div>
      </main>
    </AuthGuard>
  )
}
