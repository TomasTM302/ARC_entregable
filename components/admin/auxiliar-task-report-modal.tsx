"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuxiliarTasksStore, type Report, type Task } from "@/lib/auxiliar-tasks-store"
import { useAuthStore } from "@/lib/auth"
import { useCondominiumStore } from "@/lib/condominium-store"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FileText, Calendar, Building, User, ImageIcon } from "lucide-react"
import dynamic from "next/dynamic"

const AuxiliarTaskReportModal = dynamic(() => Promise.resolve(AuxiliarTaskReportModalComponent), { ssr: false })

interface AuxiliarTaskReportModalProps {
  isOpen: boolean
  onClose: () => void
}

function AuxiliarTaskReportModalComponent({ isOpen, onClose }: AuxiliarTaskReportModalProps) {
  // Type guard para diferenciar Tarea vs Reporte
  const isTask = (item: Task | Report): item is Task => {
    return (item as any)?.assignedTo !== undefined
  }
  const { tasks, reports } = useAuxiliarTasksStore()
  const { users } = useAuthStore()
  const { condominiums } = useCondominiumStore()
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [selectedCondominium, setSelectedCondominium] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCondominiumMenuOpen, setIsCondominiumMenuOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "tasks" | "reports">("all")
  const [condoMap, setCondoMap] = useState<Map<string, string>>(new Map())
  const [condominiumOptions, setCondominiumOptions] = useState<{ id: string; name: string }[]>([])

  // Crear un mapa de IDs de condominio a nombres para búsqueda más eficiente
  useEffect(() => {
    const map = new Map<string, string>()
    condominiums.forEach((condo) => {
      map.set(condo.id, condo.name)
    })
    setCondoMap(map)

    // Verificar los IDs de condominio en las tareas
    console.log(
      "Condominios disponibles:",
      condominiums.map((c) => ({ id: c.id, name: c.name })),
    )
    console.log(
      "IDs de condominio en tareas:",
      tasks.map((t) => ({
        taskId: t.id,
        condoId: t.condominium,
        title: t.title,
      })),
    )
  }, [condominiums, tasks])

  // Actualizar el useEffect para obtener los condominios de las tareas existentes
  useEffect(() => {
    // Obtener condominios únicos de las tareas existentes
    const uniqueCondominiums = new Map<string, string>()

    // Añadir condominios de las tareas
    tasks.forEach((task) => {
      if (task.condominium) {
        uniqueCondominiums.set(task.condominium, getCondominiumName(task.condominium))
      }
    })

    // Añadir condominios de los reportes
    reports.forEach((report) => {
      if (report.condominium) {
        uniqueCondominiums.set(report.condominium, getCondominiumName(report.condominium))
      }
    })

    // Convertir el mapa a un array de opciones
    const options = Array.from(uniqueCondominiums.entries()).map(([id, name]) => ({
      id,
      name: name || `ID: ${id}`,
    }))

    setCondominiumOptions(options)
    console.log("Condominios disponibles en tareas:", options)
  }, [tasks, reports])

  // Obtener solo personal de mantenimiento
  const mantenimientoPersonal = users.filter((user) => user.role === "mantenimiento")

  // Función para formatear la fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin fecha"
    return format(new Date(dateString), "dd MMM yyyy", { locale: es })
  }

  // Función para obtener el nombre del usuario
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user ? `${user.firstName} ${user.lastName}` : "Usuario desconocido"
  }

  // Función mejorada para obtener el nombre del condominio
  const getCondominiumName = (condoId: string | undefined) => {
    if (!condoId) return "No especificado"

    // Buscar directamente en el mapa (más eficiente)
    const condoName = condoMap.get(condoId)
    if (condoName) return condoName

    // Si no se encuentra en el mapa, buscar en el array original
    const condo = condominiums.find((c) => c.id === condoId)
    if (condo) return condo.name

    // Intentar buscar por coincidencia parcial (por si hay problemas con el formato)
    const partialMatch = condominiums.find((c) => c.id.includes(condoId) || condoId.includes(c.id))
    if (partialMatch) return partialMatch.name

    // Si todo falla, mostrar el ID para depuración
    return `No encontrado (ID: ${condoId})`
  }

  // Generar reporte - Tareas pendientes y en progreso
  const getFilteredTasks = () => {
    // Filtramos para obtener tareas pendientes y en progreso
    let filtered = tasks.filter((task) => task.status === "pending" || task.status === "in-progress")

    // Filtrar por usuario
    if (selectedUser !== "all") {
      filtered = filtered.filter((task) => task.assignedTo === selectedUser)
    }

    // Filtrar por condominio
    if (selectedCondominium !== "all") {
      filtered = filtered.filter((task) => task.condominium === selectedCondominium)
    }

    // Filtrar por fecha
    if (startDate && endDate) {
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime() + 86400000 // Añadir un día para incluir el día final completo
      filtered = filtered.filter((task) => {
        const taskDate = new Date(task.createdAt).getTime()
        return taskDate >= start && taskDate <= end
      })
    }

    return filtered
  }

  // Obtener reportes/actividades filtradas
  const getFilteredReports = () => {
    let filtered = [...reports]

    // Filtrar por usuario
    if (selectedUser !== "all") {
      filtered = filtered.filter((report) => report.auxiliarId === selectedUser)
    }

    // Filtrar por condominio
    if (selectedCondominium !== "all") {
      filtered = filtered.filter((report) => report.condominium === selectedCondominium)
    }

    // Filtrar por fecha
    if (startDate && endDate) {
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime() + 86400000
      filtered = filtered.filter((report) => {
        const reportDate = new Date(report.createdAt).getTime()
        return reportDate >= start && reportDate <= end
      })
    }

    return filtered
  }

  const filteredTasks = getFilteredTasks()
  const filteredReports = getFilteredReports()

  // Determinar qué elementos mostrar según la pestaña activa
  const getItemsToShow = () => {
    if (activeTab === "tasks") return filteredTasks
    if (activeTab === "reports") return filteredReports
    // Si es "all", mostrar ambos tipos
    return [...filteredTasks, ...filteredReports]
  }

  const itemsToShow = getItemsToShow()

  // Estadísticas
  const pendingTasks = filteredTasks.filter((task) => task.status === "pending").length
  const inProgressTasks = filteredTasks.filter((task) => task.status === "in-progress").length
  const totalReports = filteredReports.length
  const totalItems = pendingTasks + inProgressTasks + totalReports

  // Función para cargar una imagen como base64
  const loadImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "Anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0)
        resolve(canvas.toDataURL("image/jpeg"))
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = url
    })
  }

  // Actualizar la función exportToPDF para mejorar el formato y estructura del PDF
  // basado en la versión 67 que funcionaba correctamente

  const exportToPDF = async () => {
    setIsGenerating(true)

    try {
      // Importar jsPDF y jspdf-autotable
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

      // Crear nuevo documento
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

  // Usar la función autoTable en lugar de depender de la inyección al prototipo

      // Add header with logo
      doc.setFillColor(13, 44, 82) // Color corporativo
      doc.rect(0, 0, 210, 25, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.text("REPORTE DE ACTIVIDADES Y TAREAS", 105, 15, { align: "center" })

      // Intentar agregar logo si está disponible
      try {
        const logoUrl = "/arc-logo.svg"
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()
        img.crossOrigin = "Anonymous"

        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = logoUrl
        })

        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        const logoData = canvas.toDataURL("image/png")
        doc.addImage(logoData, "PNG", 10, 5, 15, 15)
      } catch (logoError) {
        console.error("Error al cargar el logo:", logoError)
        // Continuar sin logo
      }

      // Restore color for content
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)

      // Add report information
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString("es-MX")}`, 14, 35)
      doc.text(
        `Período: ${startDate ? formatDate(startDate) : "Inicio"} - ${endDate ? formatDate(endDate) : "Actual"}`,
        14,
        43,
      )
      doc.text(`Personal: ${selectedUser === "all" ? "Todo el personal" : getUserName(selectedUser)}`, 14, 51)
      doc.text(
        `Condominio: ${selectedCondominium === "all" ? "Todos los condominios" : getCondominiumName(selectedCondominium)}`,
        14,
        59,
      )

  // Summary table with improved styling
  ;(autoTable as any)(doc as any, {
        startY: 65,
        head: [["Total", "Tareas Pendientes", "Tareas En Progreso", "Actividades"]],
        body: [[totalItems, pendingTasks, inProgressTasks, totalReports]],
        theme: "grid",
        headStyles: {
          fillColor: [13, 44, 82],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: {
          halign: "center",
          fontStyle: "bold",
        },
        columnStyles: {
          0: { fillColor: [240, 240, 250] },
          1: { fillColor: [255, 247, 230] },
          2: { fillColor: [230, 240, 255] },
          3: { fillColor: [230, 255, 240] },
        },
  })

      // @ts-ignore - TypeScript doesn't know about the lastAutoTable property
      let lastY = doc.lastAutoTable.finalY + 10

      // Prepare data for tasks table
      if ((activeTab === "all" || activeTab === "tasks") && filteredTasks.length > 0) {
        doc.setFontSize(14)
        doc.setTextColor(13, 44, 82)
        doc.setFont("helvetica", "bold")
        doc.text("Tareas", 14, lastY)
        lastY += 8
        doc.setFont("helvetica", "normal")
        doc.setTextColor(0, 0, 0)

        const taskRows = filteredTasks.map((task) => [
          task.title,
          getUserName(task.assignedTo),
          task.condominium ? getCondominiumName(task.condominium) : "No especificado",
          task.status === "pending" ? "Pendiente" : "En Progreso",
          task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja",
          formatDate(task.createdAt),
        ])

    ;(autoTable as any)(doc as any, {
          startY: lastY,
          head: [["Título", "Personal", "Condominio", "Estado", "Prioridad", "Fecha Creación"]],
          body: taskRows,
          theme: "striped",
          headStyles: {
            fillColor: [13, 44, 82],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [245, 245, 255],
          },
          columnStyles: {
            3: {
              fontStyle: "bold",
      cellCallback: (cell: any, data: any) => {
                if (data.text === "Pendiente") {
                  cell.styles.textColor = [255, 140, 0] // Naranja para pendiente
                } else {
                  cell.styles.textColor = [0, 100, 200] // Azul para en progreso
                }
              },
            },
            4: {
              fontStyle: "bold",
      cellCallback: (cell: any, data: any) => {
                if (data.text === "Alta") {
                  cell.styles.textColor = [200, 0, 0] // Rojo para alta
                } else if (data.text === "Media") {
                  cell.styles.textColor = [255, 140, 0] // Naranja para media
                } else {
                  cell.styles.textColor = [0, 150, 0] // Verde para baja
                }
              },
            },
          },
    })

        // @ts-ignore
        lastY = doc.lastAutoTable.finalY + 15
      }

      // Prepare data for reports/activities
      if ((activeTab === "all" || activeTab === "reports") && filteredReports.length > 0) {
        doc.setFontSize(14)
        doc.setTextColor(13, 44, 82)
        doc.setFont("helvetica", "bold")
        doc.text("Actividades", 14, lastY)
        lastY += 8
        doc.setFont("helvetica", "normal")
        doc.setTextColor(0, 0, 0)

        // Tabla resumen de actividades
        const reportRows = filteredReports.map((report) => [
          report.title,
          report.auxiliarName,
          report.condominium ? getCondominiumName(report.condominium) : "No especificado",
          formatDate(report.createdAt),
        ])

  ;(autoTable as any)(doc as any, {
          startY: lastY,
          head: [["Título", "Personal", "Condominio", "Fecha Creación"]],
          body: reportRows,
          theme: "striped",
          headStyles: {
            fillColor: [13, 44, 82],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [240, 255, 240],
          },
  })

        // @ts-ignore
        lastY = doc.lastAutoTable.finalY + 15

        // Detalles de cada actividad con imágenes en un formato mejorado
        doc.setFontSize(14)
        doc.setTextColor(13, 44, 82)
        doc.setFont("helvetica", "bold")
        doc.text("Detalles de Actividades", 14, lastY)
        lastY += 10
        doc.setFont("helvetica", "normal")
        doc.setTextColor(0, 0, 0)

        // Procesar cada reporte con sus detalles e imágenes
        for (const report of filteredReports) {
          // Verificar si hay suficiente espacio en la página actual
          if (lastY > 220) {
            doc.addPage()
            lastY = 20
          }

          // Altura de la tarjeta - ajustable según el contenido
          const cardHeight = 100 // Altura base

          // Dibujar el recuadro principal con más espacio
          doc.setDrawColor(13, 44, 82) // Color corporativo para el borde
          doc.setLineWidth(0.5)
          doc.roundedRect(14, lastY, 182, cardHeight, 3, 3) // Bordes redondeados

          // Fondo para el título
          doc.setFillColor(230, 236, 245) // Color de fondo suave
          doc.rect(14, lastY, 182, 10, "F")

          // Título de la actividad
          doc.setFontSize(12)
          doc.setTextColor(13, 44, 82)
          doc.setFont("helvetica", "bold")
          doc.text(`Actividad: ${report.title}`, 17, lastY + 7)

          // Información de la actividad
          doc.setFont("helvetica", "normal")
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(10)

          // Columna izquierda - información básica
          const leftCol = 17
          let infoY = lastY + 20

          doc.text(`Personal: ${report.auxiliarName}`, leftCol, infoY)
          infoY += 8

          // Limitar longitud del texto del condominio
          const condoText = `Condominio: ${report.condominium ? getCondominiumName(report.condominium) : "No especificado"}`
          const condoTextTruncated = condoText.length > 50 ? condoText.substring(0, 47) + "..." : condoText
          doc.text(condoTextTruncated, leftCol, infoY)
          infoY += 8

          doc.text(`Fecha: ${formatDate(report.createdAt)}`, leftCol, infoY)
          infoY += 12

          // Descripción con mejor formato
          doc.setFontSize(10)
          doc.setFont("helvetica", "bold")
          doc.text("Descripción:", leftCol, infoY)
          doc.setFont("helvetica", "normal")
          infoY += 8

          // Procesar la descripción para que no se salga del espacio
          const description = report.description || "Sin descripción"
          const maxWidth = 90 // Ancho máximo para la descripción
          const splitDescription = doc.splitTextToSize(description, maxWidth)

          // Limitar a 3 líneas para evitar desbordamiento
          const maxLines = 3
          const displayedLines = splitDescription.slice(0, maxLines)
          doc.text(displayedLines, leftCol, infoY)

          // Indicar si hay más texto
          if (splitDescription.length > maxLines) {
            doc.setFontSize(8)
            doc.setTextColor(100, 100, 100)
            doc.text("(Texto truncado...)", leftCol, infoY + displayedLines.length * 5 + 2)
          }

          // Columna derecha - imagen
          const rightCol = 120
          doc.setFontSize(10)
          doc.setTextColor(0, 0, 0)
          doc.setFont("helvetica", "bold")
          doc.text("Imágenes:", rightCol, lastY + 20)
          doc.setFont("helvetica", "normal")

          // Recuadro para la imagen con bordes más suaves
          doc.setDrawColor(180, 180, 200)
          doc.setFillColor(245, 245, 250)
          doc.roundedRect(rightCol, lastY + 22, 70, 70, 2, 2, "FD")

          // Añadir imagen si existe
          if (report.images && report.images.length > 0) {
            try {
              // Cargar la primera imagen como base64
              const imgData = await loadImageAsBase64(report.images[0])

              // Crear una imagen temporal para obtener dimensiones originales
              const tempImg = new Image()
              tempImg.src = imgData

              // Calcular dimensiones manteniendo la relación de aspecto
              const maxWidth = 66
              const maxHeight = 66
              const containerWidth = 70
              const containerHeight = 70

              // Esperar a que la imagen cargue para obtener dimensiones
              await new Promise((resolve) => {
                tempImg.onload = resolve
              })

              // Calcular la relación de aspecto
              const aspectRatio = tempImg.width / tempImg.height

              // Determinar dimensiones finales manteniendo la relación de aspecto
              let finalWidth, finalHeight

              if (aspectRatio > 1) {
                // Imagen horizontal
                finalWidth = Math.min(maxWidth, tempImg.width)
                finalHeight = finalWidth / aspectRatio
              } else {
                // Imagen vertical o cuadrada
                finalHeight = Math.min(maxHeight, tempImg.height)
                finalWidth = finalHeight * aspectRatio
              }

              // Calcular posición para centrar la imagen en el contenedor
              const xOffset = rightCol + (containerWidth - finalWidth) / 2
              const yOffset = lastY + 24 + (containerHeight - finalHeight) / 2

              // Añadir la imagen al PDF manteniendo proporciones y centrada
              doc.addImage(imgData, "JPEG", xOffset, yOffset, finalWidth, finalHeight)

              // Si hay más imágenes, indicarlo con mejor formato
              if (report.images.length > 1) {
                doc.setFillColor(13, 44, 82)
                doc.roundedRect(rightCol + 45, lastY + 22, 25, 12, 2, 2, "F")
                doc.setFontSize(8)
                doc.setTextColor(255, 255, 255)
                doc.text(`+${report.images.length - 1}`, rightCol + 57, lastY + 30, { align: "center" })
              }
            } catch (imgError) {
              console.error("Error al cargar imagen:", imgError)
              doc.setFontSize(9)
              doc.setTextColor(150, 150, 150)
              doc.text("No se pudo cargar la imagen", rightCol + 35, lastY + 57, { align: "center" })
            }
          } else {
            doc.setFontSize(9)
            doc.setTextColor(150, 150, 150)
            doc.text("Sin imágenes", rightCol + 35, lastY + 57, { align: "center" })
          }

          // Avanzar para la siguiente actividad con espacio adicional
          lastY += cardHeight + 10
        }
      }

      // Add footer with page numbers
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        // Línea separadora
        doc.setDrawColor(13, 44, 82)
        doc.setLineWidth(0.5)
        doc.line(14, 280, 196, 280)

        // Texto del footer
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text("Arcos Bosques - Reporte de Actividades y Tareas", 14, 286)
        doc.text(`Página ${i} de ${pageCount}`, 196, 286, { align: "right" })
      }

      // Save PDF with formatted name
      const dateStr = new Date().toISOString().split("T")[0]
      const timeStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-")
      doc.save(`reporte-actividades-tareas_${dateStr}_${timeStr}.pdf`)
      setIsGenerating(false)
    } catch (error) {
      console.error("Error al generar el PDF:", error)
      alert("Ocurrió un error al generar el PDF. Por favor, intenta de nuevo.")
      setIsGenerating(false)
    }
  }

  // (isTask) definido arriba como type guard

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold">Reporte de Actividades y Tareas</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Label htmlFor="user-filter" className="block mb-2">
                Personal de Mantenimiento
              </Label>
              <div className="relative">
                <Button
                  id="user-filter"
                  variant="outline"
                  className="w-full flex items-center justify-between bg-gray-200 text-black hover:bg-gray-300"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {selectedUser === "all" ? "Todo el personal" : getUserName(selectedUser)}
                  </div>
                </Button>
                <div
                  className="absolute mt-1 w-full bg-white border rounded-md shadow-lg z-10"
                  style={{ display: isUserMenuOpen ? "block" : "none" }}
                >
                  <div className="py-1 max-h-60 overflow-y-auto">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => {
                        setSelectedUser("all")
                        setIsUserMenuOpen(false)
                      }}
                    >
                      Todo el personal
                    </button>
                    {mantenimientoPersonal.map((user) => (
                      <button
                        key={user.id}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setSelectedUser(user.id)
                          setIsUserMenuOpen(false)
                        }}
                      >
                        {user.firstName} {user.lastName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Label htmlFor="condominium-filter" className="block mb-2">
                Condominio
              </Label>
              <div className="relative">
                <Button
                  id="condominium-filter"
                  variant="outline"
                  className="w-full flex items-center justify-between bg-gray-200 text-black hover:bg-gray-300"
                  onClick={() => setIsCondominiumMenuOpen(!isCondominiumMenuOpen)}
                >
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    {selectedCondominium === "all" ? "Todos los condominios" : selectedCondominium}
                  </div>
                </Button>
                <div
                  className="absolute mt-1 w-full bg-white border rounded-md shadow-lg z-10"
                  style={{ display: isCondominiumMenuOpen ? "block" : "none" }}
                >
                  <div className="py-1 max-h-60 overflow-y-auto">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => {
                        setSelectedCondominium("all")
                        setIsCondominiumMenuOpen(false)
                      }}
                    >
                      Todos los condominios
                    </button>
                    {condominiumOptions.map((condo) => (
                      <button
                        key={condo.id}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setSelectedCondominium(condo.id)
                          setIsCondominiumMenuOpen(false)
                        }}
                      >
                        {condo.id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="start-date" className="block mb-2">
                Fecha inicio
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="start-date"
                  type="date"
                  className="pl-10"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="end-date" className="block mb-2">
                Fecha fin
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="end-date"
                  type="date"
                  className="pl-10"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filtro por tipo */}
          <div className="flex justify-center space-x-2 border-b pb-2">
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              className={activeTab === "all" ? "bg-blue-600" : ""}
              onClick={() => setActiveTab("all")}
            >
              Todos
            </Button>
            <Button
              variant={activeTab === "tasks" ? "default" : "outline"}
              className={activeTab === "tasks" ? "bg-yellow-600" : ""}
              onClick={() => setActiveTab("tasks")}
            >
              Tareas
            </Button>
            <Button
              variant={activeTab === "reports" ? "default" : "outline"}
              className={activeTab === "reports" ? "bg-green-600" : ""}
              onClick={() => setActiveTab("reports")}
            >
              Actividades
            </Button>
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3">Resumen</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-xl font-bold">{totalItems}</div>
                <div className="text-gray-600 text-sm">Total</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border">
                <div className="text-xl font-bold">{pendingTasks}</div>
                <div className="text-yellow-600 text-sm">Tareas Pendientes</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border">
                <div className="text-xl font-bold">{inProgressTasks}</div>
                <div className="text-blue-600 text-sm">Tareas En Progreso</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border">
                <div className="text-xl font-bold">{totalReports}</div>
                <div className="text-green-600 text-sm">Actividades</div>
              </div>
            </div>
          </div>

          {/* Lista de elementos */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Detalle ({itemsToShow.length})</h3>
            {itemsToShow.length === 0 ? (
              <div className="bg-gray-50 border rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-semibold mb-2">No hay datos disponibles</h4>
                <p className="text-gray-500">
                  No se encontraron actividades o tareas que coincidan con los criterios de búsqueda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-2 px-3 text-left">Título</th>
                      <th className="py-2 px-3 text-left">Personal</th>
                      <th className="py-2 px-3 text-left">Condominio</th>
                      <th className="py-2 px-3 text-left">Tipo</th>
                      <th className="py-2 px-3 text-left">Prioridad</th>
                      <th className="py-2 px-3 text-left">Fecha Creación</th>
                      {activeTab === "reports" && <th className="py-2 px-3 text-left">Imágenes</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {itemsToShow
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((item, index) => {
                        if (isTask(item)) {
                          // Es una tarea
                          const task = item
                          return (
                            <tr key={`task-${task.id}`} className="border-t">
                              <td className="py-2 px-3">{task.title}</td>
                              <td className="py-2 px-3">{getUserName(task.assignedTo)}</td>
                              <td className="py-2 px-3">{task.condominium || "No especificado"}</td>
                              <td className="py-2 px-3">
                                {task.status === "pending" ? (
                                  <span className="text-yellow-600">Tarea Pendiente</span>
                                ) : (
                                  <span className="text-blue-600">Tarea En Progreso</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {task.priority === "high" ? (
                                  <span className="text-red-600">Alta</span>
                                ) : task.priority === "medium" ? (
                                  <span className="text-orange-600">Media</span>
                                ) : (
                                  <span className="text-green-600">Baja</span>
                                )}
                              </td>
                              <td className="py-2 px-3">{formatDate(task.createdAt)}</td>
                              {activeTab === "reports" && <td className="py-2 px-3">-</td>}
                            </tr>
                          )
                        } else {
                          // Es un reporte/actividad
                          const report = item as Report
                          return (
                            <tr key={`report-${report.id}`} className="border-t">
                              <td className="py-2 px-3">{report.title}</td>
                              <td className="py-2 px-3">{report.auxiliarName}</td>
                              <td className="py-2 px-3">{report.condominium || "No especificado"}</td>
                              <td className="py-2 px-3">
                                <span className="text-green-600">Actividad</span>
                              </td>
                              <td className="py-2 px-3">-</td>
                              <td className="py-2 px-3">{formatDate(report.createdAt)}</td>
                              {activeTab === "reports" && (
                                <td className="py-2 px-3">
                                  {report.images && report.images.length > 0 ? (
                                    <div className="flex items-center">
                                      <ImageIcon className="h-4 w-4 mr-1 text-blue-500" />
                                      <span>{report.images.length}</span>
                                    </div>
                                  ) : (
                                    "No"
                                  )}
                                </td>
                              )}
                            </tr>
                          )
                        }
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="destructive" className="text-white" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={exportToPDF}
              disabled={isGenerating || itemsToShow.length === 0}
            >
              {isGenerating ? "Generando..." : "Exportar a PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AuxiliarTaskReportModal
