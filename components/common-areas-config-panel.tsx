"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useCommonAreasStore, type CommonArea } from "@/lib/common-areas-store"
import EditAreaModal from "@/components/edit-area-modal"
import DeleteCommonAreaModal from "@/components/delete-common-area-modal"
import NewCommonAreaModal from "@/components/new-common-area-modal"
import { toast } from "@/components/ui/use-toast"
import { Plus, Trash2 } from "lucide-react"

export default function CommonAreasConfigPanel() {
  const { areas, toggleAreaStatus } = useCommonAreasStore()
  const [editingArea, setEditingArea] = useState<CommonArea | null>(null)
  const [deletingArea, setDeletingArea] = useState<CommonArea | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isNewAreaModalOpen, setIsNewAreaModalOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleEditClick = (area: CommonArea) => {
    setEditingArea(area)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (area: CommonArea) => {
    setDeletingArea(area)
    setIsDeleteModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingArea(null)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletingArea(null)
  }

  const handleToggleStatus = (id: string) => {
    toggleAreaStatus(id)
    setHasChanges(true)
  }

  const handleSaveChanges = () => {
    toast({
      title: "Cambios guardados",
      description: "La configuración de áreas comunes ha sido actualizada correctamente.",
    })
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Áreas disponibles</h3>
        <Button
          variant="default"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => setIsNewAreaModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar nueva área
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map((area) => (
          <div key={area.id} className="border rounded-lg p-6 bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{area.name}</h3>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  area.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {area.isActive ? "Habilitada" : "Deshabilitada"}
              </span>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Depósito:</span>
                <span className="font-medium">${area.deposit}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Anticipación máxima:</span>
                <span className="font-medium">{area.maxAdvanceBookingDays} días</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Duración máxima:</span>
                <span className="font-medium">{area.maxDuration} horas</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Horario:</span>
                <span className="font-medium">{area.operatingHours}</span>
              </div>

              {area.maxPeople && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Capacidad máxima:</span>
                  <span className="font-medium">{area.maxPeople} personas</span>
                </div>
              )}

              {area.maxSimultaneousBookings && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Reservas simultáneas:</span>
                  <span className="font-medium">{area.maxSimultaneousBookings}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleEditClick(area)}
              >
                Editar
              </Button>
              <Button
                variant={area.isActive ? "destructive" : "default"}
                className={`w-full ${
                  area.isActive
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
                onClick={() => handleToggleStatus(area.id)}
              >
                {area.isActive ? "Deshabilitar" : "Habilitar"}
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleDeleteClick(area)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {hasChanges && (
        <div className="flex justify-end mt-6">
          <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveChanges}>
            Guardar cambios
          </Button>
        </div>
      )}

      {editingArea && <EditAreaModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} area={editingArea} />}
      {deletingArea && (
        <DeleteCommonAreaModal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} area={deletingArea} />
      )}
      <NewCommonAreaModal isOpen={isNewAreaModalOpen} onClose={() => setIsNewAreaModalOpen(false)} />
    </div>
  )
}
