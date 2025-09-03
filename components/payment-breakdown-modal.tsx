"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type PaymentBreakdown, calculateBreakdownTotal } from "@/lib/payment-breakdown"

interface PaymentBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (breakdown: PaymentBreakdown) => void
  initialAmount: number
}

export function PaymentBreakdownModal({ isOpen, onClose, onSave, initialAmount }: PaymentBreakdownModalProps) {
  const [breakdown, setBreakdown] = useState<PaymentBreakdown>({
    maintenance: initialAmount,
  })

  // Estado para controlar la visualización de secciones adicionales
  const [showRecovered, setShowRecovered] = useState(false)
  const [showFines, setShowFines] = useState(false)
  const [showAgreements, setShowAgreements] = useState(false)
  const [showOthers, setShowOthers] = useState(false)

  // Estados para nuevos elementos
  const [newRecovered, setNewRecovered] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: 0,
  })
  const [newFine, setNewFine] = useState({ description: "", amount: 0 })
  const [newAgreement, setNewAgreement] = useState({ description: "", amount: 0 })
  const [newOther, setNewOther] = useState({ description: "", amount: 0 })

  // Funciones para actualizar el desglose
  const updateMaintenance = (value: number) => {
    setBreakdown((prev) => ({ ...prev, maintenance: value }))
  }

  const updateSurcharges = (value: number) => {
    setBreakdown((prev) => ({ ...prev, surcharges: value }))
  }

  const addRecoveredPayment = () => {
    if (newRecovered.amount <= 0) return

    setBreakdown((prev) => ({
      ...prev,
      recoveredPayments: [...(prev.recoveredPayments || []), { ...newRecovered }],
    }))

    setNewRecovered({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: 0 })
  }

  const addFine = () => {
    if (!newFine.description || newFine.amount <= 0) return

    setBreakdown((prev) => ({
      ...prev,
      fines: [...(prev.fines || []), { ...newFine }],
    }))

    setNewFine({ description: "", amount: 0 })
  }

  const addAgreement = () => {
    if (!newAgreement.description || newAgreement.amount <= 0) return

    setBreakdown((prev) => ({
      ...prev,
      agreements: [...(prev.agreements || []), { ...newAgreement }],
    }))

    setNewAgreement({ description: "", amount: 0 })
  }

  const addOther = () => {
    if (!newOther.description || newOther.amount <= 0) return

    setBreakdown((prev) => ({
      ...prev,
      others: [...(prev.others || []), { ...newOther }],
    }))

    setNewOther({ description: "", amount: 0 })
  }

  // Funciones para eliminar elementos
  const removeRecoveredPayment = (index: number) => {
    setBreakdown((prev) => ({
      ...prev,
      recoveredPayments: prev.recoveredPayments?.filter((_, i) => i !== index),
    }))
  }

  const removeFine = (index: number) => {
    setBreakdown((prev) => ({
      ...prev,
      fines: prev.fines?.filter((_, i) => i !== index),
    }))
  }

  const removeAgreement = (index: number) => {
    setBreakdown((prev) => ({
      ...prev,
      agreements: prev.agreements?.filter((_, i) => i !== index),
    }))
  }

  const removeOther = (index: number) => {
    setBreakdown((prev) => ({
      ...prev,
      others: prev.others?.filter((_, i) => i !== index),
    }))
  }

  // Calcular el total
  const total = calculateBreakdownTotal(breakdown)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Desglose del Pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="maintenance">Cuota de Mantenimiento</Label>
            <Input
              id="maintenance"
              type="number"
              value={breakdown.maintenance || 0}
              onChange={(e) => updateMaintenance(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surcharges">Recargos por Pago Tardío</Label>
            <Input
              id="surcharges"
              type="number"
              value={breakdown.surcharges || 0}
              onChange={(e) => updateSurcharges(Number(e.target.value))}
            />
          </div>

          {/* Sección de Cuotas Recuperadas */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <Label>Cuotas Recuperadas</Label>
              <Button variant="outline" size="sm" onClick={() => setShowRecovered(!showRecovered)}>
                {showRecovered ? "Ocultar" : "Mostrar"}
              </Button>
            </div>

            {showRecovered && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="recovered-month">Mes</Label>
                    <Input
                      id="recovered-month"
                      type="number"
                      min="1"
                      max="12"
                      value={newRecovered.month}
                      onChange={(e) => setNewRecovered({ ...newRecovered, month: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recovered-year">Año</Label>
                    <Input
                      id="recovered-year"
                      type="number"
                      value={newRecovered.year}
                      onChange={(e) => setNewRecovered({ ...newRecovered, year: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recovered-amount">Monto</Label>
                    <Input
                      id="recovered-amount"
                      type="number"
                      value={newRecovered.amount}
                      onChange={(e) => setNewRecovered({ ...newRecovered, amount: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <Button size="sm" onClick={addRecoveredPayment}>
                  Agregar
                </Button>

                {breakdown.recoveredPayments && breakdown.recoveredPayments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {breakdown.recoveredPayments.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span>
                          {item.month}/{item.year}: ${item.amount}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => removeRecoveredPayment(index)}>
                          Eliminar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sección de Multas */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <Label>Multas</Label>
              <Button variant="outline" size="sm" onClick={() => setShowFines(!showFines)}>
                {showFines ? "Ocultar" : "Mostrar"}
              </Button>
            </div>

            {showFines && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="fine-description">Descripción</Label>
                    <Input
                      id="fine-description"
                      value={newFine.description}
                      onChange={(e) => setNewFine({ ...newFine, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fine-amount">Monto</Label>
                    <Input
                      id="fine-amount"
                      type="number"
                      value={newFine.amount}
                      onChange={(e) => setNewFine({ ...newFine, amount: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <Button size="sm" onClick={addFine}>
                  Agregar
                </Button>

                {breakdown.fines && breakdown.fines.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {breakdown.fines.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span>
                          {item.description}: ${item.amount}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => removeFine(index)}>
                          Eliminar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sección de Convenios */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <Label>Convenios</Label>
              <Button variant="outline" size="sm" onClick={() => setShowAgreements(!showAgreements)}>
                {showAgreements ? "Ocultar" : "Mostrar"}
              </Button>
            </div>

            {showAgreements && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="agreement-description">Descripción</Label>
                    <Input
                      id="agreement-description"
                      value={newAgreement.description}
                      onChange={(e) => setNewAgreement({ ...newAgreement, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="agreement-amount">Monto</Label>
                    <Input
                      id="agreement-amount"
                      type="number"
                      value={newAgreement.amount}
                      onChange={(e) => setNewAgreement({ ...newAgreement, amount: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <Button size="sm" onClick={addAgreement}>
                  Agregar
                </Button>

                {breakdown.agreements && breakdown.agreements.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {breakdown.agreements.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span>
                          {item.description}: ${item.amount}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => removeAgreement(index)}>
                          Eliminar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sección de Otros */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <Label>Otros Conceptos</Label>
              <Button variant="outline" size="sm" onClick={() => setShowOthers(!showOthers)}>
                {showOthers ? "Ocultar" : "Mostrar"}
              </Button>
            </div>

            {showOthers && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="other-description">Descripción</Label>
                    <Input
                      id="other-description"
                      value={newOther.description}
                      onChange={(e) => setNewOther({ ...newOther, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="other-amount">Monto</Label>
                    <Input
                      id="other-amount"
                      type="number"
                      value={newOther.amount}
                      onChange={(e) => setNewOther({ ...newOther, amount: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <Button size="sm" onClick={addOther}>
                  Agregar
                </Button>

                {breakdown.others && breakdown.others.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {breakdown.others.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span>
                          {item.description}: ${item.amount}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => removeOther(index)}>
                          Eliminar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Total */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="destructive" className="text-white" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(breakdown)}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
