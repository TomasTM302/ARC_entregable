import type { PaymentBreakdown } from "@/lib/payment-breakdown"

interface PaymentBreakdownViewProps {
  breakdown: PaymentBreakdown
  className?: string
}

export function PaymentBreakdownView({ breakdown, className = "" }: PaymentBreakdownViewProps) {
  if (!breakdown) return null

  return (
    <div className={`bg-gray-50 p-3 rounded-md text-sm ${className}`}>
      <h4 className="font-medium mb-2">Desglose del pago</h4>

      <div className="space-y-2">
        {breakdown.maintenance !== undefined && (
          <div className="flex justify-between">
            <span>Cuota de mantenimiento:</span>
            <span className="font-medium">${breakdown.maintenance.toLocaleString()}</span>
          </div>
        )}

        {breakdown.surcharges !== undefined && (
          <div className="flex justify-between">
            <span>Recargos por pago tardío:</span>
            <span className="font-medium">${breakdown.surcharges.toLocaleString()}</span>
          </div>
        )}

        {breakdown.recoveredPayments && breakdown.recoveredPayments.length > 0 && (
          <div>
            <div className="font-medium mb-1">Cuotas recuperadas:</div>
            {breakdown.recoveredPayments.map((item, index) => (
              <div key={index} className="flex justify-between pl-3">
                <span>
                  {item.month}/{item.year}:
                </span>
                <span>${item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {breakdown.fines && breakdown.fines.length > 0 && (
          <div>
            <div className="font-medium mb-1">Multas:</div>
            {breakdown.fines.map((item, index) => (
              <div key={index} className="flex justify-between pl-3">
                <span>{item.description}:</span>
                <span>${item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {breakdown.agreements && breakdown.agreements.length > 0 && (
          <div>
            <div className="font-medium mb-1">Convenios:</div>
            {breakdown.agreements.map((item, index) => (
              <div key={index} className="flex justify-between pl-3">
                <span>{item.description}:</span>
                <span>${item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {breakdown.others && breakdown.others.length > 0 && (
          <div>
            <div className="font-medium mb-1">Otros conceptos:</div>
            {breakdown.others.map((item, index) => (
              <div key={index} className="flex justify-between pl-3">
                <span>{item.description}:</span>
                <span>${item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-2 mt-2 font-bold flex justify-between">
          <span>Total:</span>
          <span>${calculateTotal(breakdown).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

// Función para calcular el total del desglose
function calculateTotal(breakdown: PaymentBreakdown): number {
  let total = 0

  if (breakdown.maintenance) {
    total += breakdown.maintenance
  }

  if (breakdown.surcharges) {
    total += breakdown.surcharges
  }

  if (breakdown.recoveredPayments) {
    total += breakdown.recoveredPayments.reduce((sum, item) => sum + item.amount, 0)
  }

  if (breakdown.fines) {
    total += breakdown.fines.reduce((sum, item) => sum + item.amount, 0)
  }

  if (breakdown.agreements) {
    total += breakdown.agreements.reduce((sum, item) => sum + item.amount, 0)
  }

  if (breakdown.others) {
    total += breakdown.others.reduce((sum, item) => sum + item.amount, 0)
  }

  return total
}
