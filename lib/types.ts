export interface MaintenancePayment {
  id: string
  userId: string
  userName: string
  amount: number
  paymentDate: string
  paymentMethod: "transfer" | "credit_card"
  status: "pending" | "completed" | "rejected"
  receiptUrl?: string
  notes?: string
  month: number
  year: number
  createdAt?: string
  updatedAt?: string
  updatedBy?: string
  residentInfo?: any
  residentStatus?: string
  comments?: string
  trackingKey?: string
  breakdown?: any
}
// Tipos compartidos (independientes del store frontend)

export interface MaintenancePriceHistory {
  id: string
  price: number
  effectiveDate: string
  createdBy: string
  createdAt: string
  notes?: string
}

export interface BankingDetails {
  bankName: string
  accountHolder: string
  clabe: string
  reference?: string
  updatedAt?: string
  updatedBy?: string
}

// Aviso según API SQL
export interface Aviso {
  id: string | number
  titulo: string
  contenido: string
  autor_id?: string | number | null
  condominio_id?: string | number | null
  fecha_publicacion?: string | null
  fecha_expiracion?: string | null
  imagen_url?: string | null
  importante?: string | null // 'general' | 'emergencia' | 'mantenimiento' | etc
}
