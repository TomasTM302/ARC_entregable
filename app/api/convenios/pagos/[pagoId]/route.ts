import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: { pagoId: string } }) {
  const { pagoId } = params
  try {
  const body = await req.json()
  console.log("[API][CONVENIOS][PAGOS][PATCH] id:", pagoId, "body:", body)
  // Nota: pagos_convenio NO tiene columna referencia_id según el esquema provisto
  const fields = ["estado", "fecha_pago", "pago_id", "monto", "fecha_vencimiento", "numero_pago"] as const
    const sets: string[] = []
    const values: any[] = []
    for (const f of fields) {
      if (f in body) {
        sets.push(`${f} = ?`)
        values.push(body[f])
      }
    }
    if (sets.length === 0) return NextResponse.json({ success: false, message: "Sin cambios" }, { status: 400 })
  await pool.execute(`UPDATE pagos_convenio SET ${sets.join(", ")} WHERE id = ?`, [...values, pagoId])
  console.log("[API][CONVENIOS][PAGOS][PATCH] updated id:", pagoId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: "Error al actualizar el pago del convenio" }, { status: 500 })
  }
}
