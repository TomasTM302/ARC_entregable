"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import ResetAuthButton from "@/components/reset-auth-button"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/home"
  const { login, setRememberMe } = useAuthStore()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [rememberMe, setRememberMeState] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMeState(e.target.checked)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Update the rememberMe state in the store
      setRememberMe(rememberMe)

      const { success, message } = await login(formData)

      if (success) {
        // Check if the user is a vigilante or mantenimiento and redirect accordingly
        const { isVigilante, isMantenimiento } = useAuthStore.getState()
        if (isVigilante) {
          router.push("/vigilante")
        } else if (isMantenimiento) {
          router.push("/mantenimiento")
        } else {
          router.push(redirect)
        }
      } else {
        setError(message || "Error al iniciar sesión")
      }
    } catch (err) {
      setError("Ocurrió un error inesperado")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#0e2c52] relative">
      <section className="container mx-auto flex-1 flex flex-col items-center justify-center py-8">
        <div className="bg-white rounded-lg p-8 w-full max-w-md text-gray-800 mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/images/arcos-logo3.png" alt="ARCOS Logo" width={160} height={160} className="object-contain" priority />
          </div>

          <h2 className="text-2xl font-semibold mb-6 text-center">Iniciar Sesión</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  className="h-4 w-4 text-[#3b6dc7] focus:ring-[#3b6dc7] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="text-[#3b6dc7] hover:text-[#2d5db3]">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white py-2"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          {/* Botón para resetear la autenticación */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">¿Problemas con el inicio de sesión?</p>
            <ResetAuthButton />
          </div>
        </div>
      </section>
    </main>
  )
}
