"use client"
import { useEffect, useState } from "react"
import { UserPlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth"
import AuthGuard from "@/components/auth-guard"
import RegisterUserModal from "@/components/register-user-modal"

export default function UsersPage() {
  const { getUsers, fetchUsers, deleteUser } = useAuthStore()
  const users = getUsers()
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [condominiums, setCondominiums] = useState<{ id: number, name: string }[]>([])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return
    if (
      !confirm(
        'Esta acción eliminará el registro permanentemente. ¿Continuar?'
      )
    )
      return
    await deleteUser(id)
  }

  useEffect(() => {
    fetchUsers()
    fetch('/api/condominios')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCondominiums(data.condominiums)
      })
  }, [])

  // Función para obtener el estilo y texto según el rol
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "admin":
        return { bgColor: "bg-blue-100", textColor: "text-blue-800", label: "Administrador" }
      case "mantenimiento":
        return { bgColor: "bg-amber-100", textColor: "text-amber-800", label: "Mantenimiento" }
      case "vigilante":
        return { bgColor: "bg-purple-100", textColor: "text-purple-800", label: "Vigilante" }
      default:
        return { bgColor: "bg-green-100", textColor: "text-green-800", label: "Residente" }
    }
  }

  return (
    <AuthGuard requireAuth requireAdmin>
      <div className="bg-white rounded-lg p-6 w-full text-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Usuarios Registrados</h2>
          <Button className="bg-[#3b6dc7] hover:bg-[#2d5db3] text-white" onClick={() => setIsRegisterModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Nombre</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Teléfono</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Condominio</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Casa</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Rol</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.filter(Boolean).map((user) => {
                if (!user || !user.role) return null;
                const { bgColor, textColor, label } = getRoleBadgeStyle(user.role)
                // Buscar el nombre del condominio por ID
                const condoName = user.condominiumId
                  ? (condominiums.find(c => c.id.toString() === user.condominiumId)?.name || user.condominiumId)
                  : '-'
                const house = user.house && user.house.trim() !== '' ? user.house : '-'
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="py-3 px-4 text-sm">{user.email}</td>
                    <td className="py-3 px-4 text-sm">{user.phone}</td>
                    <td className="py-3 px-4 text-sm">{condoName}</td>
                    <td className="py-3 px-4 text-sm">{house}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${bgColor} ${textColor}`}>{label}</span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No hay usuarios registrados.</p>
          </div>
        )}

        {/* Modal de registro de usuario */}
        <RegisterUserModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} />
      </div>
    </AuthGuard>
  )
}
