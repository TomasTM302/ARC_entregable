"use client"
import { User, Home, Phone, Mail, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth"
import AuthGuard from "@/components/auth-guard"

export default function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <AuthGuard requireAuth>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Mi Perfil</h2>

            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 bg-[#3b6dc7] rounded-full flex items-center justify-center text-white text-3xl mb-4">
                {user?.firstName.charAt(0)}
                {user?.lastName.charAt(0)}
              </div>
              <h3 className="text-xl font-medium">
                {user?.firstName} {user?.lastName}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  user?.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                }`}
              >
                {user?.role === "admin" ? "Administrador" : "Residente"}
              </span>
            </div>

            <div className="space-y-6">
              <div className="border-t border-b border-gray-200 py-4">
                <h4 className="text-lg font-medium mb-4">Información Personal</h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Nombre completo</p>
                      <p className="font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Home className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Residencia</p>
                      <p className="font-medium">{user?.house}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 py-4">
                <h4 className="text-lg font-medium mb-4">Información de Contacto</h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Correo electrónico</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium">{user?.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="py-4">
                <h4 className="text-lg font-medium mb-4">Seguridad</h4>
                <Button className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800">
                  <Key className="h-4 w-4 mr-2" />
                  Cambiar contraseña
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
