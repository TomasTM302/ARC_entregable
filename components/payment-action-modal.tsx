"use client"

import { useState } from "react"
import { X, Check, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MaintenancePayment } from "@/lib/types"
import { useFinesStore } from "@/lib/fines-store"

interface PaymentActionModalProps {
  payment: MaintenancePayment
  isOpen: boolean
  onClose: () => void
}

export function PaymentActionModal({ payment, isOpen, onClose }: PaymentActionModalProps) {
  // Migrado a API: actualizar pago por id
  const updateMaintenancePayment = async (id: string, payload: any) => {
    try {
      await fetch(`/api/pagos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } catch (e) {
      console.error("Error actualizando pago", e)
    }
  }
  const { markFineAsPaid } = useFinesStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [notes, setNotes] = useState("")

  if (!isOpen) return null

  const handleApprove = async () => {
    setIsProcessing(true)

    try {
      // Si el breakdown incluye parcialidades de convenios, marcarlas como pagadas
      if (payment.breakdown?.agreements && payment.breakdown.agreements.length > 0) {
        const now = new Date().toISOString()
        await Promise.all(
          payment.breakdown.agreements.map((a: any) =>
            fetch(`/api/convenios/pagos/${a.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ estado: "pagado", fecha_pago: now, pago_id: payment.id }),
            }),
          ),
        )
      }

      // Actualizar el estado del pago
      await updateMaintenancePayment(payment.id, {
        estado: "completed",
        notas: notes || payment.notes,
      })

      // Marcar multas como pagadas si las hay en el breakdown
      if (payment.breakdown?.fines) {
        payment.breakdown.fines.forEach((fine: { id: string }) => {
          markFineAsPaid(fine.id, payment.id)
        })
      }

      alert("Pago aprobado exitosamente")
      onClose()
    } catch (error) {
      alert("Error al aprobar el pago")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!confirm("¿Está seguro de que desea rechazar este pago?")) return

    setIsProcessing(true)

    try {
      await updateMaintenancePayment(payment.id, {
        estado: "rejected",
        notas: notes || "Pago rechazado por el administrador",
      })

      alert("Pago rechazado")
      onClose()
    } catch (error) {
      alert("Error al rechazar el pago")
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "transfer":
        return "Transferencia"
      case "credit_card":
        return "Tarjeta de Crédito"
      default:
        return "Otro"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Pagado"
      case "pending":
        return "Pendiente"
      case "rejected":
        return "Rechazado"
      default:
        return "Desconocido"
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Detalles del Pago</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Residente</label>
              <p className="text-sm text-gray-900">{payment.userName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección</label>
              <p className="text-sm text-gray-900">
                {payment.residentInfo?.street} {payment.residentInfo?.houseNumber}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
              <p className="text-sm text-gray-900">{getPaymentMethodName(payment.paymentMethod)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <p className="text-sm text-gray-900">{formatDate(payment.paymentDate)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(payment.status)}`}>
                {getStatusText(payment.status)}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto Total</label>
              <p className="text-lg font-bold text-gray-900">${payment.amount.toLocaleString()}</p>
            </div>
          </div>

          {/* Desglose del pago */}
          {payment.breakdown && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-3">Desglose del Pago</h3>
              <div className="space-y-2">
                {payment.breakdown.maintenance && (
                  <div className="flex justify-between">
                    <span>Cuota de mantenimiento:</span>
                    <span className="font-medium">${payment.breakdown.maintenance.toLocaleString()}</span>
                  </div>
                )}

                {payment.breakdown.surcharges && (
                  <div className="flex justify-between text-red-600">
                    <span>Recargos por pago tardío:</span>
                    <span className="font-medium">${payment.breakdown.surcharges.toLocaleString()}</span>
                  </div>
                )}

                {payment.breakdown.fines && payment.breakdown.fines.length > 0 && (
                  <div>
                    <div className="flex justify-between font-medium">
                      <span>Multas:</span>
                      <span>
                        ${payment.breakdown.fines.reduce((sum: number, fine: { amount: number }) => sum + fine.amount, 0).toLocaleString()}
                      </span>
                    </div>
                    {payment.breakdown.fines.map((fine: { id: string; description: string; amount: number }) => (
                      <div key={fine.id} className="flex justify-between pl-4 text-sm text-gray-600">
                        <span>• {fine.description}:</span>
                        <span>${fine.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {payment.breakdown.agreements && payment.breakdown.agreements.length > 0 && (
                  <div>
                    <div className="flex justify-between font-medium">
                      <span>Convenios de pago:</span>
                      <span>
                        $
                        {payment.breakdown.agreements
                          .reduce((sum: number, agreement: { amount: number }) => sum + agreement.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    {payment.breakdown.agreements.map((agreement: { id: string; description: string; amount: number }) => (
                      <div key={agreement.id} className="flex justify-between pl-4 text-sm text-gray-600">
                        <span>• {agreement.description}:</span>
                        <span>${agreement.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {payment.breakdown.advancePayments && payment.breakdown.advancePayments.length > 0 && (
                  <div>
                    <div className="flex justify-between font-medium text-green-600">
                      <span>Pagos adelantados:</span>
                      <span>
                        $
                        {payment.breakdown.advancePayments
                          .reduce((sum: number, advance: { amount: number }) => sum + advance.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    {payment.breakdown.advancePayments.map((advance: { month: number; year: number; amount: number }, index: number) => (
                      <div key={index} className="flex justify-between pl-4 text-sm text-green-600">
                        <span>
                          •{" "}
                          {new Date(advance.year, advance.month - 1).toLocaleDateString("es-ES", {
                            month: "long",
                            year: "numeric",
                          })}
                          :
                        </span>
                        <span>${advance.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${payment.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Información adicional */}
          {payment.trackingKey && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Clave de Rastreo</label>
              <p className="text-sm font-mono text-gray-900">{payment.trackingKey}</p>
            </div>
          )}

          {payment.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Notas</label>
              <p className="text-sm text-gray-900">{payment.notes}</p>
            </div>
          )}

          {/* Notas del administrador */}
          {payment.status === "pending" && (
            <div>
              <label htmlFor="admin-notes" className="block text-sm font-medium text-gray-700">
                Notas del administrador (opcional)
              </label>
              <textarea
                id="admin-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agregar notas sobre este pago..."
              />
            </div>
          )}

          {/* Acciones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cerrar
            </Button>

            {payment.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex items-center"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isProcessing ? "Procesando..." : "Rechazar"}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isProcessing ? "Procesando..." : "Aprobar"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
