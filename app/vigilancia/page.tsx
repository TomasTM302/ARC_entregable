"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, AlertTriangle } from "lucide-react"
import { useAuthStore } from "@/lib/auth"

export default function VigilanciaPage() {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { user } = useAuthStore()

  const handleRequestVigilance = () => {
    setShowConfirmation(true)
  }

  const handleConfirm = () => {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccess(true)

      // Redirect after success
      setTimeout(() => {
        router.push("/home")
      }, 3000)
    }, 1500)
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Solicitud enviada</h1>
        <p className="text-gray-600 mb-6">
          Un vigilante ha sido notificado y se dirigirá a tu domicilio lo antes posible.
        </p>
        <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Serás redirigido a la página principal en unos segundos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 px-2">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Solicitar vigilancia</h1>

      {!showConfirmation ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <ShieldAlert size={24} className="text-[#0e2c52] mr-3" />
              <h2 className="text-xl font-semibold">Asistencia de vigilancia</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Solicita que un vigilante acuda a tu domicilio para asistencia o verificación de seguridad.
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <AlertTriangle size={20} className="text-yellow-600 mr-2" />
                <p className="text-yellow-700">
                  Usa este servicio solo en caso de necesidad real. El uso indebido puede resultar en restricciones.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-2">Información de tu domicilio:</h3>
              <p>
                <strong>Casa:</strong> {user?.house || "No especificada"}
              </p>
              <p>
                <strong>Residente:</strong> {user?.name || "No especificado"}
              </p>
            </div>

            <button
              onClick={handleRequestVigilance}
              className="w-full bg-[#0e2c52] text-white py-3 rounded-lg font-medium hover:bg-[#1a4580] transition-colors"
            >
              Solicitar vigilante
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-3">¿Cuándo usar este servicio?</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Cuando notes actividad sospechosa cerca de tu domicilio</li>
              <li>Si escuchas ruidos extraños en el exterior</li>
              <li>Para verificar la seguridad de tu propiedad</li>
              <li>En caso de emergencias menores que no requieran servicios médicos</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Confirmar solicitud</h2>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-center text-yellow-800">
              ¿Estás seguro de que deseas solicitar que un vigilante acuda a tu domicilio?
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-medium ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#0e2c52] text-white hover:bg-[#1a4580]"
              } transition-colors`}
            >
              {isSubmitting ? "Enviando solicitud..." : "Sí, enviar solicitud"}
            </button>

            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
