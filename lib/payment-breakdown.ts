// Definición de tipos para el desglose de pagos

export interface PaymentBreakdownItem {
  description: string
  amount: number
}

export interface RecoveredPayment {
  month: number
  year: number
  amount: number
}

export interface PaymentBreakdown {
  // Cuota mensual regular
  maintenance?: number

  // Recargos por pago tardío
  surcharges?: number

  // Cuotas recuperadas de meses anteriores
  recoveredPayments?: RecoveredPayment[]

  // Multas
  fines?: PaymentBreakdownItem[]

  // Convenios de pago
  agreements?: PaymentBreakdownItem[]

  // Otros conceptos
  others?: PaymentBreakdownItem[]
}

// Función para calcular el total de un desglose
export function calculateBreakdownTotal(breakdown: PaymentBreakdown): number {
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

// Función para crear un desglose de ejemplo
export function createSampleBreakdown(amount: number): PaymentBreakdown {
  // Por defecto, asumimos que todo es cuota de mantenimiento
  return {
    maintenance: amount,
  }
}

// Función para crear un desglose detallado basado en la situación del residente
export function createDetailedBreakdown(
  maintenanceAmount: number,
  hasFines = false,
  hasAgreements = false,
  hasLatePayment = false,
): PaymentBreakdown {
  const breakdown: PaymentBreakdown = {
    maintenance: maintenanceAmount,
  }

  // Si tiene recargo por pago tardío
  if (hasLatePayment) {
    const surcharge = Math.round(maintenanceAmount * 0.1) // 10% de recargo
    breakdown.surcharges = surcharge
  }

  // Si tiene multas pendientes
  if (hasFines) {
    breakdown.fines = [
      {
        description: "Multa por estacionamiento indebido",
        amount: 500,
      },
    ]
  }

  // Si tiene convenios de pago
  if (hasAgreements) {
    breakdown.agreements = [
      {
        description: "Pago de convenio por adeudo anterior",
        amount: 300,
      },
    ]
  }

  return breakdown
}
