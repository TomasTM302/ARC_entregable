"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Bell, AlertTriangle, Wrench, PawPrintIcon as Paw, Plus, Edit, Trash2, ArrowLeft } from "lucide-react"
// Store eliminado; esta página usa API SQL
import { useAuthStore } from "@/lib/auth"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import CreateNoticeModal from "@/components/create-notice-modal"
import EditNoticeModal from "@/components/edit-notice-modal"
import DeleteNoticeModal from "@/components/delete-notice-modal"
import type { Aviso as Notice } from "@/lib/types"

export default function AvisosPage() {
  // const { notices, markNoticeAsRead } = useAppStore()
  const [notices, setNotices] = useState<any[]>([])
  // Obtener avisos desde la API SQL
  useEffect(() => {
    fetch("/api/avisos")
      .then((res) => res.json())
      .then((data) => {
        // La API devuelve avisos con campos: id, titulo, contenido, autor_id, condominio_id, fecha_publicacion, fecha_expiracion, imagen_url, importante
        if (data.success && Array.isArray(data.avisos)) setNotices(data.avisos)
        else setNotices([])
      })
      .catch(() => setNotices([]))
  }, [])
  // markNoticeAsRead ya no aplica
  const { isAdmin } = useAuthStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const success = searchParams.get("success")
  const from = searchParams.get("from") || "home"
  // Añadir este console.log después de la línea anterior
  useEffect(() => {
    console.log("Parámetro 'from':", from)
  }, [from])
  const [showSuccess, setShowSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

  useEffect(() => {
    if (success === "true") {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const getNoticeIcon = (type: string) => {
    switch (type) {
      case "emergencia":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "mantenimiento":
        return <Wrench className="h-5 w-5 text-yellow-500" />
      case "mascota_extraviada":
        return <Paw className="h-5 w-5 text-emerald-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNoticeBgColor = (type: string, isRead: boolean) => {
    if (!isRead) return "bg-blue-50"

    switch (type) {
      case "emergencia":
        return "hover:bg-red-50"
      case "mantenimiento":
        return "hover:bg-yellow-50"
      default:
        return "hover:bg-gray-50"
    }
  }

  // No se requiere lógica de "leído", los avisos se mantienen hasta expiración o eliminación.

  const handleEditClick = (e: React.MouseEvent, notice: Notice) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedNotice(notice)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, notice: Notice) => {
    e.preventDefault()
    e.stopPropagation()
    // Doble verificación
    const seguro = window.confirm("¿Estás seguro de que quieres eliminar este aviso? Esta acción no se puede deshacer.");
    if (!seguro) return;
    // Actualizar fecha de expiración en la base de datos
    const hoy = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fechaHoy = `${hoy.getFullYear()}-${pad(hoy.getMonth()+1)}-${pad(hoy.getDate())} ${pad(hoy.getHours())}:${pad(hoy.getMinutes())}:${pad(hoy.getSeconds())}`;
    fetch(`/api/avisos/${notice.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha_expiracion: fechaHoy })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotices(prev => prev.filter(n => n.id !== notice.id))
          setDeleteSuccess(true)
          setTimeout(() => setDeleteSuccess(false), 4000)
        }
      })
      .catch(() => {/* opcional: mostrar error */})
    setSelectedNotice(null)
    setIsDeleteModalOpen(false)
  }

  // Determinar la URL de retorno basada en el parámetro "from"
  const backUrl = from === "admin" ? "/admin" : "/home"

  // Filtrar avisos expirados
  const avisosVigentes = notices.filter((notice) => {
    if (!notice.fecha_expiracion) return true;
    const ahora = new Date();
    const expiracion = new Date(notice.fecha_expiracion);
    return expiracion >= ahora;
  });

  return (
    <main className="flex min-h-screen flex-col bg-[#0e2c52] pb-20">
      <header className="container mx-auto py-4 px-4 max-w-7xl">
        <Link href={backUrl} className="flex items-center text-white hover:text-gray-200">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver {from === "admin" ? "al panel" : "al inicio"}
        </Link>
      </header>
      <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8 px-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 mb-8 mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center">
              <Bell className="mr-2 h-6 w-6" />
              Avisos
            </h2>

            {isAdmin && from === "admin" && (
              <Button className="bg-[#3b6dc7] hover:bg-[#2d5db3] text-white" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Aviso
              </Button>
            )}
          </div>

          {showSuccess && (
            <div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
              role="alert"
            >
              <strong className="font-bold">¡Éxito! </strong>
              <span className="block sm:inline">Tu reporte de mascota extraviada ha sido publicado.</span>
            </div>
          )}
          {deleteSuccess && (
            <div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
              role="alert"
            >
              <strong className="font-bold">Aviso eliminado correctamente.</strong>
            </div>
          )}

          {avisosVigentes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No hay avisos disponibles en este momento.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {avisosVigentes.map((notice) => (
                <li key={notice.id}>
                  <Link
                    href={`/avisos/${notice.id}`}
                    className="block border rounded-lg p-4 transition-colors hover:bg-gray-50 relative"
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-0.5">{getNoticeIcon(notice.importante || "general")}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          {notice.titulo}
                          {notice.importante === 'mascota_extraviada' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              <Paw className="h-3.5 w-3.5" /> Mascota extraviada
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{notice.contenido}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notice.fecha_publicacion ? format(new Date(notice.fecha_publicacion), "d 'de' MMMM, yyyy - HH:mm", { locale: es }) : ""}
                        </p>
                        {notice.imagen_url && (
                          <div className="mt-2">
                            <img
                              src={notice.imagen_url || "/placeholder.svg"}
                              alt="Imagen del aviso"
                              className="h-20 object-cover rounded-md"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Botones de edición y eliminación para administradores (solo si viene del panel admin) */}
                    {isAdmin && from === "admin" && (
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <button
                          onClick={(e) => handleEditClick(e, notice)}
                          className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"
                          title="Editar aviso"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, notice)}
                          className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"
                          title="Eliminar aviso"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Modales */}
      <CreateNoticeModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <EditNoticeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} notice={selectedNotice} />
      <DeleteNoticeModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        notice={selectedNotice}
      />
    </main>
  )
}
