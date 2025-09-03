"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  BarChart3,
  Users,
  Check,
  Search,
  Filter,
  FileText,
  X,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCommonAreasStore } from "@/lib/common-areas-store"
import AuthGuard from "@/components/auth-guard"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import CommonAreasConfigPanel from "@/components/common-areas-config-panel"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function AdminCommonAreasPage() {
  // Estado para reservaciones reales
  const [reservaciones, setReservaciones] = useState<any[]>([])

  // Variables simuladas para estadísticas
  const reservationStats = {
    total: 0,
    confirmed: 0,
    pending: 0,
    canceled: 0,
  }
  const incomeStats = {
    deposits: 0,
    eventIncome: 0,
    total: 0,
  }
  const userStats = {
    total: 0,
  }
  const [areas, setAreas] = useState<any[]>([])
  const [condominios, setCondominios] = useState<any[]>([])
  // Obtener áreas comunes y reservaciones desde el endpoint real
  useEffect(() => {
    fetch("/api/areas-comunes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.areas)) {
          setAreas(data.areas)
        }
      })
      .catch(() => setAreas([]))
    // Obtener condominios
    fetch("/api/condominios")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.condominiums)) {
          setCondominios(data.condominiums)
        }
      })
      .catch(() => setCondominios([]))
    // Obtener reservaciones reales
    fetch("/api/reservaciones")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reservaciones)) {
          setReservaciones(data.reservaciones)
        }
      })
      .catch(() => setReservaciones([]))
  }, [])
  const [activeTab, setActiveTab] = useState("calendar")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isEditAreaOpen, setIsEditAreaOpen] = useState(false)
  const [selectedArea, setSelectedArea] = useState<any>(null)
  const [isNewArea, setIsNewArea] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [paymentMenuOpen, setPaymentMenuOpen] = useState(false)
  const [orderFilter, setOrderFilter] = useState<'desc' | 'asc'>('desc');
  const [orderMenuOpen, setOrderMenuOpen] = useState(false);

  // Puedes mantener los datos simulados para las estadísticas si lo deseas

  // Lógica de calendario real
  const daysOfWeek = ["lu", "ma", "mi", "ju", "vi", "sa", "do"];
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(selectedDate);
    d.setDate(1);
    return d;
  });
  // Generar los días del mes actual (con días previos y siguientes para completar la cuadrícula)
  const getDaysInCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    // Día de la semana en que inicia el mes (0=domingo, 1=lunes...)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Ajustar para que lunes sea 0
    // Días del mes anterior
    for (let i = 0; i < startDay; i++) {
      const prevDate = new Date(year, month, -startDay + i + 1);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
      });
    }
    // Días del mes actual
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }
    // Días del mes siguiente para completar la cuadrícula (hasta múltiplo de 7)
    while (days.length % 7 !== 0) {
      const totalCellsNeeded: number = Math.ceil((startDay + lastDay.getDate()) / 7) * 7;
      const offset: number = days.length - (startDay + lastDay.getDate()) + 1;
      const nextDate: Date = new Date(year, month, lastDay.getDate() + offset);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
      });
    }
    return days;
  };
  const daysInMonth = getDaysInCalendar();
  // Días con reservaciones confirmadas
  const reservationDatesSet = new Set(reservaciones.filter(r => r.estado === "confirmada").map(r => {
    const d = new Date(r.fecha_reservacion);
    d.setHours(0,0,0,0);
    return d.getTime();
  }));
  // Formato de mes actual
  const currentMonth = calendarMonth.toLocaleString('es-MX', { month: 'long', year: 'numeric' });

  // Reservaciones del día seleccionado (solo confirmadas)
  const selectedDayReservations = reservaciones.filter((reservation) => {
    if (reservation.estado !== "confirmada") return false;
    // Asegura que la fecha sea comparable correctamente
    const resDate = new Date(reservation.fecha_reservacion);
    resDate.setHours(0,0,0,0);
    const selDate = new Date(selectedDate);
    selDate.setHours(0,0,0,0);
    return resDate.getTime() === selDate.getTime();
  }).map((reservation) => {
    const area = areas.find((a: any) => a.id === reservation.area_comun_id);
    return {
      id: reservation.id,
      name: area ? (area.nombre || area.name) : reservation.area_comun_id,
      status: "confirmed",
      time: `${reservation.hora_inicio} - ${reservation.hora_fin}`,
      contact: reservation.contacto || reservation.contact || "-",
      resident: reservation.usuario_id || reservation.residente || "-",
      address: reservation.direccion || "-",
      date: reservation.fecha_reservacion,
    };
  });


  // Debug: mostrar datos recibidos y filtrados
  console.log("reservaciones recibidas de la API:", reservaciones)
  const pagosFiltrados = reservaciones.filter((r: any) => r.tipo_pago === "Transferencia" && r.estado === "pendiente")
  console.log("reservaciones filtradas (transferencia y pendiente):", pagosFiltrados)
  const pendingPayments = pagosFiltrados
    .map((r: any) => {
      // Buscar nombre de área
      const area = areas.find((a: any) => a.id === r.area_comun_id)
      // Buscar nombre de usuario en reservación si existe
      let clientName = r.nombre_usuario || r.usuario_nombre || r.usuario || r.usuario_id
      // Formatear fecha
      const dateObj = new Date(r.fecha_reservacion);
      const formattedDate = dateObj.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
      // Si el backend no envía el nombre, mostrar el id
      return {
        id: r.id,
        area: area ? (area.nombre || area.name) : r.area_comun_id,
        date: formattedDate,
        time: `${r.hora_inicio} - ${r.hora_fin}`,
        client: clientName,
        contact: r.contacto || "-", // Si tienes campo de contacto
        amount: r.monto_pago || r.monto || 0,
        reference: r.referencia_transferencia || "-", // Si tienes campo de referencia
      }
    })

  // Handler para aprobar/rechazar pagos por transferencia
  // Estado para mostrar el diálogo de confirmación de pago
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, id: number | null, newStatus: "confirmada" | "cancelada" | null }>({ open: false, id: null, newStatus: null });

  const handlePaymentStatus = (id: number, newStatus: "confirmada" | "cancelada") => {
    setConfirmDialog({ open: true, id, newStatus });
  };

  const handleConfirmDialogAccept = async () => {
    if (!confirmDialog.id || !confirmDialog.newStatus) return;
    try {
      const res = await fetch(`/api/reservaciones/${confirmDialog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: confirmDialog.newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        alert("Error al actualizar el estado en el backend: " + (data.message || "Error desconocido"));
        setConfirmDialog({ open: false, id: null, newStatus: null });
        return;
      }
      setReservaciones((prev) => prev.map((r) => r.id === confirmDialog.id ? { ...r, estado: confirmDialog.newStatus } : r));
      alert(confirmDialog.newStatus === "confirmada" ? "Pago aprobado correctamente." : "Pago rechazado correctamente.");
    } catch (err) {
      alert("Error de red al actualizar el estado");
    }
    setConfirmDialog({ open: false, id: null, newStatus: null });
  };

  const handleConfirmDialogCancel = () => {
    setConfirmDialog({ open: false, id: null, newStatus: null });
  };

  // Depósitos reembolsables: solo reservaciones en estado 'confirmada' y fecha igual o posterior a hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalizar a medianoche
  const refundableDeposits = reservaciones
    .filter((r: any) => {
      if (r.estado !== "confirmada") return false;
      const resDate = new Date(r.fecha_reservacion);
      resDate.setHours(0, 0, 0, 0); // Normalizar a medianoche
      return resDate >= today;
    })
    .map((r: any) => {
      const area = areas.find((a: any) => a.id === r.area_comun_id);
      // Formatear fecha
      const dateObj = new Date(r.fecha_reservacion);
      const formattedDate = dateObj.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
      return {
        id: r.id,
        area: area ? (area.nombre || area.name) : r.area_comun_id,
        date: formattedDate,
        resident: r.usuario_id,
        amount: area ? (area.monto_deposito || area.deposit || 0) : 0,
        status: r.estado,
      };
    });

  const handleEditArea = (area: any) => {
    // Mapear propiedades para que coincidan con los campos del formulario
    setSelectedArea({
      id: area.id,
      nombre: area.nombre ?? "",
      descripcion: area.descripcion ?? "",
      monto_deposito: area.monto_deposito ?? "",
      horario_apertura: area.horario_apertura ?? "",
      horario_cierre: area.horario_cierre ?? "",
      capacidad: area.capacidad ?? "",
      costo_reservacion: area.costo_reservacion ?? "",
      activo: area.activo ?? 'Inactivo',
      requiere_deposito: area.requiere_deposito ?? 0,
      tipo: area.tipo ?? "common",
      condominio_id: area.condominio_id ?? "",
      imagen_url: area.imagen_url ?? "", // Si quieres mostrar imagen en el formulario
    });
    setIsNewArea(false);
    setIsEditAreaOpen(true);
  }

  const handleAddArea = () => {
    setSelectedArea({
      name: "",
      deposit: "",
      operatingHours: "",
      maxDuration: "",
      capacity: "",
      maxAdvance: "",
      description: "",
      activo: 'Activo',
    })
    setIsNewArea(true)
    setIsEditAreaOpen(true)
  }

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <header className="container mx-auto py-4 px-4 max-w-7xl">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="flex items-center text-white hover:text-gray-200">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Volver al panel administrativo
            </Link>
          </div>
        </header>

        <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-7xl text-gray-800 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Panel de Administración de Áreas Comunes</h2>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="border rounded-lg p-6 flex flex-col items-center">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-4xl font-bold">{reservationStats.total}</div>
                <div className="text-gray-500">Reservaciones totales</div>
              </div>

              <div className="border rounded-lg p-6 flex flex-col items-center">
                <div className="bg-green-100 p-3 rounded-full mb-4">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-4xl font-bold">{reservationStats.confirmed}</div>
                <div className="text-gray-500">Confirmadas</div>
              </div>

              <div className="border rounded-lg p-6 flex flex-col items-center">
                <div className="bg-yellow-100 p-3 rounded-full mb-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-4xl font-bold">{reservationStats.pending}</div>
                <div className="text-gray-500">Pendientes</div>
              </div>

              <div className="border rounded-lg p-6 flex flex-col items-center">
                <div className="bg-red-100 p-3 rounded-full mb-4">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-4xl font-bold">{reservationStats.canceled}</div>
                <div className="text-gray-500">Canceladas</div>
              </div>
            </div>

            {/* Secciones de ingresos y usuarios */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">Ingresos</h3>
                <p className="text-gray-500 mb-6">Resumen de ingresos por depósitos y costos de eventos</p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-4">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-gray-500">Depósitos totales</div>
                        <div className="text-2xl font-bold">${incomeStats.deposits.toLocaleString()}</div>
                      </div>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                      Reembolsables
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-full mr-4">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-gray-500">Ingresos por eventos</div>
                        <div className="text-2xl font-bold">${incomeStats.eventIncome.toLocaleString()}</div>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                      No reembolsables
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-2 rounded-full mr-4">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-gray-500">Total</div>
                        <div className="text-2xl font-bold">${incomeStats.total.toLocaleString()}</div>
                      </div>
                    </div>
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar reporte
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">Usuarios</h3>
                <p className="text-gray-500 mb-6">Información de residentes registrados</p>

                <div className="flex flex-col items-center mb-6">
                  <div className="mb-4">
                    <Users className="h-16 w-16 text-blue-600" />
                  </div>
                  <div className="text-4xl font-bold">{userStats.total}</div>
                  <div className="text-gray-500">Usuarios registrados</div>
                </div>

                <Button variant="outline" className="w-full bg-gray-200 text-black hover:bg-gray-300">
                  Ver todos los usuarios
                </Button>
              </div>
            </div>

            {/* Pestañas de navegación */}
            <div className="bg-gray-50 rounded-lg p-2 mb-6 flex overflow-x-auto">
              <button
                className={`px-4 py-2 rounded-md whitespace-nowrap ${activeTab === "calendar" ? "bg-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveTab("calendar")}
              >
                Calendario de reservaciones
              </button>
              <button
                className={`px-4 py-2 rounded-md whitespace-nowrap ${activeTab === "list" ? "bg-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveTab("list")}
              >
                Lista de reservaciones
              </button>
              <button
                className={`px-4 py-2 rounded-md whitespace-nowrap ${activeTab === "payments" ? "bg-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveTab("payments")}
              >
                Pagos por transferencia
              </button>
              <button
                className={`px-4 py-2 rounded-md whitespace-nowrap ${activeTab === "deposits" ? "bg-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveTab("deposits")}
              >
                Depósitos reembolsables
              </button>
              <button
                className={`px-4 py-2 rounded-md whitespace-nowrap ${activeTab === "config" ? "bg-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveTab("config")}
              >
                Configuración de áreas
              </button>
            </div>

            {/* Calendario de reservaciones */}
            {activeTab === "calendar" && (
              <div className="border rounded-lg p-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Reservaciones por fecha</h3>
                  <p className="text-gray-500">Selecciona una fecha para ver las reservaciones</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <button className="p-1 hover:bg-gray-100 rounded" onClick={() => {
                        const prev = new Date(calendarMonth);
                        prev.setMonth(prev.getMonth() - 1);
                        setCalendarMonth(prev);
                      }}>
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <div className="font-medium">{currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}</div>
                      <button className="p-1 hover:bg-gray-100 rounded" onClick={() => {
                        const next = new Date(calendarMonth);
                        next.setMonth(next.getMonth() + 1);
                        setCalendarMonth(next);
                      }}>
                        <ArrowLeft className="h-5 w-5 transform rotate-180" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {daysOfWeek.map((day, i) => (
                        <div key={i} className="text-center text-sm text-gray-500">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {daysInMonth.map((dayObj, i) => {
                        const d = dayObj.date;
                        const isSelected = d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth() && d.getDate() === selectedDate.getDate();
                        const hasReservation = reservationDatesSet.has(d.getTime());
                        return (
                          <button
                            key={i}
                            className={`h-10 w-full rounded-md flex items-center justify-center text-sm
                              ${!dayObj.isCurrentMonth ? "text-gray-300" : ""}
                              ${isSelected ? "bg-blue-600 text-white" : hasReservation ? "bg-blue-200 text-blue-900 font-bold" : "hover:bg-gray-100"}
                            `}
                            onClick={() => {
                              if (dayObj.isCurrentMonth) {
                                setSelectedDate(new Date(d));
                              }
                            }}
                          >
                            {d.getDate()}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-6">
                      <Button variant="default" className="w-full bg-blue-600">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar reporte del día
                      </Button>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <h4 className="text-lg font-semibold mb-4">
                      Reservaciones para el {selectedDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </h4>
                    <div className="space-y-4">
                      {selectedDayReservations.length === 0 ? (
                        <div className="text-gray-500">No hay reservaciones para este día.</div>
                      ) : (
                        selectedDayReservations.map((reservation) => (
                          <div key={reservation.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center">
                                <div className="bg-blue-100 p-2 rounded-full mr-3">
                                  <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                                <span className="font-medium">{reservation.name}</span>
                              </div>
                              {reservation.status === "confirmed" ? (
                                <Badge className="bg-green-500">Confirmada</Badge>
                              ) : (
                                <Badge className="bg-yellow-500">Pendiente</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Horario:</p>
                                <p className="font-medium">{reservation.time}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Reservado por:</p>
                                <p className="font-medium">{reservation.resident}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Contacto:</p>
                                <p className="font-medium">{reservation.contact}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Dirección:</p>
                                <p className="font-medium">{reservation.address}</p>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center bg-gray-200 text-black hover:bg-gray-300"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Comprobante
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de reservaciones */}
            {activeTab === "list" && (
              <div className="border rounded-lg p-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Todas las reservaciones</h3>
                  <p className="text-gray-500">Lista completa de reservaciones</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar por ID, área, usuario o fecha..." className="pl-10" />
                    </div>
                  </div>
                <div className="flex gap-2">
                    {/* Filtro de orden */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="flex items-center bg-gray-200 text-black hover:bg-gray-300"
                        onClick={() => setOrderMenuOpen(!orderMenuOpen)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {orderFilter === 'desc' ? 'Más nuevo primero' : 'Más antiguo primero'}
                      </Button>
                      <div
                        className="absolute mt-1 w-48 bg-white border rounded-md shadow-lg z-10"
                        style={{ display: orderMenuOpen ? "block" : "none" }}
                      >
                        <div className="py-1">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setOrderFilter('desc');
                              setOrderMenuOpen(false);
                            }}
                          >
                            Más nuevo primero
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setOrderFilter('asc');
                              setOrderMenuOpen(false);
                            }}
                          >
                            Más antiguo primero
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="flex items-center bg-gray-200 text-black hover:bg-gray-300"
                        onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {statusFilter === "all"
                          ? "Todos los estados"
                          : statusFilter === "confirmed"
                            ? "Confirmadas"
                            : statusFilter === "pending"
                              ? "Pendientes"
                              : "Canceladas"}
                      </Button>
                      <div
                        className="absolute mt-1 w-40 bg-white border rounded-md shadow-lg z-10"
                        style={{ display: statusMenuOpen ? "block" : "none" }}
                      >
                        <div className="py-1">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setStatusFilter("all")
                              setStatusMenuOpen(false)
                            }}
                          >
                            Todos los estados
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setStatusFilter("confirmed")
                              setStatusMenuOpen(false)
                            }}
                          >
                            Confirmadas
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setStatusFilter("pending")
                              setStatusMenuOpen(false)
                            }}
                          >
                            Pendientes
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setStatusFilter("canceled")
                              setStatusMenuOpen(false)
                            }}
                          >
                            Canceladas
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="flex items-center bg-gray-200 text-black hover:bg-gray-300"
                        onClick={() => setPaymentMenuOpen(!paymentMenuOpen)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {paymentFilter === "all"
                          ? "Todos los pagos"
                          : paymentFilter === "pending"
                            ? "Pendientes"
                            : "Completos"}
                      </Button>
                      <div
                        className="absolute mt-1 w-40 bg-white border rounded-md shadow-lg z-10"
                        style={{ display: paymentMenuOpen ? "block" : "none" }}
                      >
                        <div className="py-1">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setPaymentFilter("all")
                              setPaymentMenuOpen(false)
                            }}
                          >
                            Todos los pagos
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setPaymentFilter("pending")
                              setPaymentMenuOpen(false)
                            }}
                          >
                            Pendientes
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setPaymentFilter("complete")
                              setPaymentMenuOpen(false)
                            }}
                          >
                            Completos
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button variant="default" className="bg-blue-600">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar reporte
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left">ID</th>
                        <th className="py-3 px-4 text-left">Área</th>
                        <th className="py-3 px-4 text-left">Fecha</th>
                        <th className="py-3 px-4 text-left">Horario</th>
                        <th className="py-3 px-4 text-left">Usuario</th>
                        <th className="py-3 px-4 text-left">Pago</th>
                        <th className="py-3 px-4 text-left">Estado</th>
                        <th className="py-3 px-4 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Filtrado y ordenamiento de reservaciones */}
                      {(() => {
                        let filtered = reservaciones;
                        // Filtro de estado
                        if (statusFilter !== "all") {
                          filtered = filtered.filter((r: any) => {
                            if (statusFilter === "confirmed") return r.estado === "confirmada";
                            if (statusFilter === "pending") return r.estado === "pendiente";
                            if (statusFilter === "canceled") return r.estado === "cancelada";
                            return true;
                          });
                        }
                        // Filtro de pago
                        if (paymentFilter !== "all") {
                          filtered = filtered.filter((r: any) => {
                            if (paymentFilter === "pending") return r.tipo_pago === "Transferencia" && r.estado === "pendiente";
                            if (paymentFilter === "complete") return r.estado === "confirmada";
                            return true;
                          });
                        }
                        // Ordenar por fecha
                        filtered = filtered.slice().sort((a: any, b: any) => {
                          const dateA = new Date(a.fecha_reservacion).getTime();
                          const dateB = new Date(b.fecha_reservacion).getTime();
                          return orderFilter === 'desc' ? dateB - dateA : dateA - dateB;
                        });
                        if (filtered.length === 0) {
                          return <tr><td colSpan={8} className="text-center py-6 text-gray-500">No hay reservaciones registradas.</td></tr>;
                        }
                        return filtered.map((reservation: any) => {
                          // Buscar nombre de área por id
                          const area = areas.find((a: any) => a.id === reservation.area_comun_id)
                          // Solo mostrar la fecha (sin horas)
                          const fechaSolo = reservation.fecha_reservacion
                            ? new Date(reservation.fecha_reservacion).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })
                            : '';
                          return (
                            <tr key={reservation.id} className="border-b">
                              <td className="py-3 px-4">{reservation.id}</td>
                              <td className="py-3 px-4">{area ? (area.nombre || area.name) : reservation.area_comun_id}</td>
                              <td className="py-3 px-4">{fechaSolo}</td>
                              <td className="py-3 px-4">{reservation.hora_inicio} - {reservation.hora_fin}</td>
                              <td className="py-3 px-4">{reservation.usuario_id}</td>
                              <td className="py-3 px-4">-</td>
                              <td className="py-3 px-4">
                                {reservation.estado === "confirmada" ? (
                                  <Badge className="bg-green-500">Confirmada</Badge>
                                ) : reservation.estado === "pendiente" ? (
                                  <Badge className="bg-yellow-500">Pendiente</Badge>
                                ) : reservation.estado === "cancelada" ? (
                                  <Badge className="bg-red-500">Cancelada</Badge>
                                ) : (
                                  <Badge className="bg-gray-400">{reservation.estado}</Badge>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          )
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagos por transferencia */}
            {activeTab === "payments" && (
              <div className="border rounded-lg p-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Pagos por transferencia pendientes</h3>
                  <p className="text-gray-500">Verifica y aprueba los pagos realizados por transferencia bancaria</p>
                </div>

                <div className="space-y-6">
            {pendingPayments.map((payment) => (
              <div key={payment.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Info className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-medium">Transferencia pendiente</span>
                  <Badge className="ml-auto bg-yellow-500">Pendiente de verificación</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Reservación:</p>
                    <p className="font-medium">
                      {payment.id} - {payment.area}
                    </p>

                    <p className="text-sm text-gray-500 mt-4 mb-1">Fecha y horario:</p>
                    <p className="font-medium">
                      {payment.date} | {payment.time}
                    </p>

                    <p className="text-sm text-gray-500 mt-4 mb-1">Monto:</p>
                    <p className="font-medium">${payment.amount}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cliente:</p>
                    <p className="font-medium">{payment.client}</p>

                    <p className="text-sm text-gray-500 mt-4 mb-1">Contacto:</p>
                    <p className="font-medium">{payment.contact}</p>

                    <p className="text-sm text-gray-500 mt-4 mb-1">Referencia de transferencia:</p>
                    <p className="font-medium">{payment.reference}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center">
                    <Info className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium">Verificación requerida</span>
                  </div>
                  <p className="text-sm mt-1">
                    Verifica que la transferencia se haya recibido correctamente antes de aprobar el pago.
                  </p>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="default" className="bg-red-600 text-white hover:bg-red-700" onClick={() => handlePaymentStatus(payment.id, "cancelada") }>
                    <X className="h-4 w-4 mr-1" />
                    Rechazar
                  </Button>
                  <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handlePaymentStatus(payment.id, "confirmada") }>
                    <Check className="h-4 w-4 mr-1" />
                    Aprobar
                  </Button>
                </div>
              </div>
            ))}

            {/* Diálogo de confirmación para aprobar/rechazar pago (fuera del map) */}
            {confirmDialog.open && (
              <Dialog open={confirmDialog.open} onOpenChange={handleConfirmDialogCancel}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold mb-2">
                      {confirmDialog.newStatus === "confirmada" ? "¿Aprobar pago por transferencia?" : "¿Rechazar pago por transferencia?"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mb-4">
                    {confirmDialog.newStatus === "confirmada"
                      ? "¿Estás seguro de que deseas aprobar este pago? Esta acción no se puede deshacer."
                      : "¿Estás seguro de que deseas rechazar este pago? Esta acción no se puede deshacer."}
                  </div>
                  <DialogFooter className="flex gap-2 justify-end">
                    <Button variant="outline" className="bg-gray-200 text-black hover:bg-gray-300" onClick={handleConfirmDialogCancel}>
                      Cancelar
                    </Button>
                    <Button variant="default" className={confirmDialog.newStatus === "confirmada" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} onClick={handleConfirmDialogAccept}>
                      {confirmDialog.newStatus === "confirmada" ? "Aceptar" : "Rechazar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
                </div>
              </div>
            )}

            {/* Depósitos reembolsables */}
            {activeTab === "deposits" && (
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold">Depósitos Reembolsables</h3>
                  <Button variant="outline" className="flex items-center bg-gray-200 text-black hover:bg-gray-300">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar reporte
                  </Button>
                </div>

                <div className="bg-white rounded-lg border p-6 mb-6">
                  <h4 className="text-xl font-semibold mb-2">Estado de depósitos</h4>
                  <p className="text-gray-500 mb-6">Gestiona los depósitos reembolsables de las reservaciones</p>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Reservación</th>
                          <th className="py-3 px-4 text-left">Área</th>
                          <th className="py-3 px-4 text-left">Fecha</th>
                          <th className="py-3 px-4 text-left">Residente</th>
                          <th className="py-3 px-4 text-left">Monto</th>
                          <th className="py-3 px-4 text-left">Estado</th>
                          <th className="py-3 px-4 text-left">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {refundableDeposits.map((deposit) => (
                          <tr key={deposit.id} className="border-b">
                            <td className="py-3 px-4">{deposit.id}</td>
                            <td className="py-3 px-4">{deposit.area}</td>
                            <td className="py-3 px-4">{deposit.date}</td>
                            <td className="py-3 px-4">{deposit.resident}</td>
                            <td className="py-3 px-4">${deposit.amount.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              {deposit.status === "pendiente" && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full">Pendiente</span>
                              )}
                              {deposit.status === "confirmada" && (
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">Confirmada</span>
                              )}
                              {deposit.status === "cancelada" && (
                                <span className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full">Cancelada</span>
                              )}
                              {deposit.status === "completada" && (
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">Completada</span>
                              )}
                              {/* Si el estado no es ninguno de los anteriores, mostrar el texto tal cual */}
                              {["pendiente","confirmada","cancelada","completada"].indexOf(deposit.status) === -1 && (
                                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-3 py-1 rounded-full">{deposit.status}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {deposit.status === "pendiente" ? (
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <Check className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Configuración de áreas */}
            {activeTab === "config" && (
              <div className="border rounded-lg p-6">
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Configuración de áreas comunes</h3>
                    <p className="text-gray-500">Administra los parámetros de las áreas comunes</p>
                    <h4 className="text-xl font-semibold mt-6">Áreas disponibles</h4>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2" onClick={handleAddArea}>
                    <span className="text-xl font-bold">+</span> Agregar nueva área
                  </Button>
                </div>

                {/* Mostrar las áreas dinámicamente */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {areas.length === 0 ? (
                    <p className="text-gray-500 col-span-full">No hay áreas registradas.</p>
                  ) : (
                    areas.map((area) => (
                      <div key={area.id} className="bg-white border rounded-lg p-6 flex flex-col shadow-sm">
                        {/* 1. Nombre */}
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xl font-bold">{area.nombre}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${area.activo === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{area.activo === 'Activo' ? 'Habilitada' : 'Deshabilitada'}</span>
                        </div>
                        {/* 2. Tipo */}
                        <div className="text-blue-700 font-medium mb-2">Área común</div>
                        {/* 3. Imagen */}
                        <div className="flex justify-center mb-2">
                          <img src={area.imagen_url || "/placeholder-logo.png"} alt={area.nombre} className="h-20 w-20 rounded-full object-cover bg-blue-50" />
                        </div>
                        {/* 4. Descripción */}
                        <div className="text-gray-600 mb-2">{area.descripcion}</div>
                        {/* 5. Anticipación máxima (fijo o campo si existe) */}
                        <div className="mb-1"><strong>Reservación con máximo 0 días de anticipación</strong></div>
                        {/* 6. Horario */}
                        <div className="mb-1"><strong>Horario:</strong> {area.horario_apertura || "—"} - {area.horario_cierre || "—"}</div>
                        {/* 7. Depósito reembolsable */}
                        {(() => {
                          // Algunas BD/devs devuelven requiere_deposito como 1/0, boolean, o string "1"/"0".
                          const req = area?.requiere_deposito;
                          const requiresDeposit = req === 1 || req === true || req === '1' || req === 'true' || Number(req) === 1 || Number(area?.monto_deposito) > 0;
                          return (
                            <div className="mb-1">
                              <strong>Depósito reembolsable:</strong>{' '}
                              {requiresDeposit && area?.monto_deposito != null && String(area?.monto_deposito) !== ''
                                ? `$${Number(area.monto_deposito).toLocaleString()}`
                                : '—'}
                            </div>
                          );
                        })()}
                        {/* 8. Capacidad máxima */}
                        <div className="mb-1"><strong>Capacidad máxima:</strong> {area.capacidad ? `${area.capacidad} personas` : "—"}</div>
                        {/* 9. Costo de la reservación */}
                        <div className="mb-1">
                          <strong>Costo de la reservación:</strong>{' '}
                          {area.costo_reservacion !== undefined && area.costo_reservacion !== null && String(area.costo_reservacion) !== ''
                            ? `$${Number(area.costo_reservacion).toLocaleString()}`
                            : '—'}
                        </div>
                        {/* 10. Botones */}
                        <div className="mt-4 flex flex-col gap-2">
                          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={() => handleEditArea(area)}>
                            Editar
                          </Button>
                          <Button
                            size="lg"
                            className={`font-semibold ${area.activo === 'Activo' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                            onClick={async () => {
                              const accion = area.activo === 'Activo' ? 'deshabilitar' : 'habilitar';
                              if (!window.confirm(`¿Seguro que deseas ${accion} el área "${area.nombre}"?`)) return;
                              try {
                                const nuevoEstado = area.activo === 'Activo' ? 'Inactivo' : 'Activo';
                                const res = await fetch(`/api/areas-comunes/${area.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ activo: nuevoEstado }),
                                });
                                const data = await res.json();
                                if (!data.success) {
                                  alert("Error al actualizar el estado en el backend: " + (data.message || "Error desconocido"));
                                  return;
                                }
                                setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, activo: nuevoEstado } : a));
                                alert(`Área ${accion === 'deshabilitar' ? 'deshabilitada' : 'habilitada'} correctamente.`);
                              } catch (err) {
                                alert("Error de red al actualizar el área");
                              }
                            }}
                          >
                            {area.activo === 'Activo' ? 'Deshabilitar' : 'Habilitar'}
                          </Button>
                          <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-red-500 flex items-center justify-center gap-2 font-semibold" onClick={() => alert('Eliminar área ' + area.nombre)}>
                             Eliminar
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Modal de edición de área */}
        <Dialog open={isEditAreaOpen} onOpenChange={setIsEditAreaOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold mb-4">
                {isNewArea ? "Agregar área común" : `Editar ${selectedArea?.name}`}
              </DialogTitle>
            </DialogHeader>
            <form className="space-y-4" id="area-form">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium mb-1">Nombre</label>
                <input id="nombre" name="nombre" type="text" defaultValue={selectedArea?.nombre || selectedArea?.name} className="w-full rounded-lg bg-gray-100 px-4 py-2 text-base border border-gray-200" required />
              </div>
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium mb-1">Descripción</label>
                <textarea id="descripcion" name="descripcion" defaultValue={selectedArea?.descripcion || selectedArea?.description} className="w-full rounded-lg bg-gray-100 px-4 py-2 text-base border border-gray-200" rows={2} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="capacidad" className="block text-sm font-medium mb-1">Capacidad máxima (personas)</label>
                  <input id="capacidad" name="capacidad" type="number" defaultValue={selectedArea?.capacidad || selectedArea?.capacity} className="w-full rounded-lg bg-gray-100 px-4 py-2 text-base border border-gray-200" required />
                </div>
                <div>
                  <label htmlFor="costo_reservacion" className="block text-sm font-medium mb-1">Costo reservación ($)</label>
                  <input id="costo_reservacion" name="costo_reservacion" type="number" step="0.01" defaultValue={selectedArea?.costo_reservacion || ""} className="w-full rounded-lg bg-gray-100 px-4 py-2 text-base border border-gray-200" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="horario_apertura" className="block text-sm font-medium mb-1">Horario apertura</label>
                  <input id="horario_apertura" name="horario_apertura" type="time" defaultValue={selectedArea?.horario_apertura || ""} className="w-full rounded-lg bg-gray-100 px-4 py-2 text-base border border-gray-200" required />
                </div>
                <div>
                  <label htmlFor="horario_cierre" className="block text-sm font-medium mb-1">Horario cierre</label>
                  <input id="horario_cierre" name="horario_cierre" type="time" defaultValue={selectedArea?.horario_cierre || ""} className="w-full rounded-lg bg-gray-100 px-4 py-2 text-base border border-gray-200" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="requiere_deposito" className="block text-sm font-medium mb-1">¿Requiere depósito?</label>
                  <input id="requiere_deposito" name="requiere_deposito" type="checkbox" defaultChecked={selectedArea?.requiere_deposito === 1 || selectedArea?.requiere_deposito === true} className="mr-2" />
                </div>
                <div>
                  <label htmlFor="monto_deposito" className="block text-sm font-medium mb-1">Monto depósito ($)</label>
                  <input id="monto_deposito" name="monto_deposito" type="number" step="0.01" defaultValue={selectedArea?.monto_deposito || ""} className="w-full rounded-lg bg-gray-100 px-4 py-2 text-base border border-gray-200" />
                </div>
              </div>
              {/* Select de condominio */}
              <div>
                <label htmlFor="condominio_id" className="block text-sm font-medium mb-1">Condominio</label>
                <select
                  id="condominio_id"
                  name="condominio_id"
                  defaultValue={selectedArea?.condominio_id || ""}
                  className="w-full rounded-lg bg-gray-100 px-4 py-2 text-base border border-gray-200"
                  required
                >
                  <option value="" disabled>Selecciona un condominio</option>
                  {condominios.map((condo) => (
                    <option key={condo.id} value={condo.id}>{condo.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="activo" className="block text-sm font-medium mb-1">¿Área activa?</label>
                  <input id="activo" name="activo" type="checkbox" defaultChecked={selectedArea?.activo === 1 || selectedArea?.activo === true || selectedArea?.isActive === true} className="mr-2" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tipo" className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    id="tipo"
                    name="tipo"
                    defaultValue={selectedArea?.tipo || "common"}
                    className="w-full rounded-lg bg-gray-100 px-4 py-2 text-base border border-gray-200"
                    required
                  >
                    <option value="common">Común</option>
                    <option value="private">Privado</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="estado" className="block text-sm font-medium mb-1">Estado</label>
                  <select
                    id="estado"
                    name="estado"
                    defaultValue={selectedArea?.estado || "confirmada"}
                    className="w-full rounded-lg bg-gray-100 px-4 py-2 text-base border border-gray-200"
                    required
                  >
                    <option value="confirmada">Confirmada</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>
            </form>
            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" className="bg-red-500 text-white hover:bg-red-600 px-6 py-2 font-semibold rounded-lg" onClick={() => setIsEditAreaOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-semibold rounded-lg"
                onClick={async (e) => {
                  e.preventDefault();
                  const form = document.getElementById("area-form") as HTMLFormElement | null;
                  if (!form) return;
                  const fd = new FormData(form);
                  // Construir objeto con los nombres de campo que espera el backend
                  const areaData: any = {
                    nombre: fd.get("nombre") || "",
                    descripcion: fd.get("descripcion") || "",
                    monto_deposito: fd.get("monto_deposito") ? Number(fd.get("monto_deposito")) : 0,
                    horario_apertura: fd.get("horario_apertura") || "00:00",
                    horario_cierre: fd.get("horario_cierre") || "00:00",
                    capacidad: fd.get("capacidad") ? Number(fd.get("capacidad")) : 0,
                    costo_reservacion: fd.get("costo_reservacion") ? Number(fd.get("costo_reservacion")) : 0,
                    activo: fd.get("activo") === "on" ? 'Activo' : 'Inactivo',
                    requiere_deposito: fd.get("requiere_deposito") === "on" ? 1 : 0,
                    tipo: fd.get("tipo") || "common",
                    condominio_id: fd.get("condominio_id") ? Number(fd.get("condominio_id")) : null,
                    estado: fd.get("estado") || "confirmada",
                  };
                  // Si es edición, agregar el id
                  if (selectedArea && selectedArea.id) {
                    (areaData as any).id = selectedArea.id;
                  }
                  console.log("areaData enviado al backend:", areaData);
                  // Validación básica
                  if (!areaData.nombre || !areaData.descripcion || !areaData.capacidad || !areaData.horario_apertura || !areaData.horario_cierre || !areaData.condominio_id) {
                    alert("Por favor completa todos los campos obligatorios.");
                    return;
                  }
                  try {
                    const res = await fetch("/api/areas-comunes", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(areaData),
                    });
                    const data = await res.json();
                    if (data.success) {
                      if ((areaData as any).id) {
                        // Edición: actualizar el área en el arreglo
                        setAreas((prev) => prev.map((a) => a.id === (areaData as any).id ? { ...a, ...areaData } : a));
                      } else {
                        // Nueva: agregar al arreglo
                        setAreas((prev) => [...prev, data.area]);
                      }
                      setIsEditAreaOpen(false);
                    } else {
                      alert("Error al guardar el área: " + (data.message || "Error desconocido"));
                    }
                  } catch (err) {
                    alert("Error de red al guardar el área");
                  }
                }}
              >
                Guardar cambios
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </AuthGuard>
  )
}
