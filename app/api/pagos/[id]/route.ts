import { NextResponse } from "next/server"
import pool from "@/lib/db"

function mapDbStatusToApp(s: any): "pending" | "completed" | "late" | "canceled" {
  const t = String(s || "").toLowerCase()
  switch (t) {
    case "pendiente":
      return "pending"
    case "pagado":
      return "completed"
    case "atrasado":
      return "late"
    case "cancelado":
      return "canceled"
    case "pending":
    case "completed":
    case "late":
    case "canceled":
      return t as any
    default:
      return "pending"
  }
}
function mapAppStatusToDb(s: any): string {
  const t = String(s || "").toLowerCase()
  switch (t) {
    case "pending":
      return "pendiente"
    case "completed":
      return "pagado"
    case "late":
      return "atrasado"
    case "canceled":
      return "cancelado"
    default:
      return t
  }
}

function mapRow(row: any) {
  return {
    id: String(row.id),
    userId: row.usuario_id != null ? String(row.usuario_id) : "",
    userName: row.usuario_nombre ?? "",
    amount: Number(row.monto ?? 0),
    paymentDate: row.fecha_pago ?? null,
    status: mapDbStatusToApp(row.estado),
    notes: row.notas ?? null,
    month: Number(row.periodo_mes ?? 0),
    year: Number(row.periodo_anio ?? 0),
    dueDate: row.fecha_vencimiento ?? null,
    pagoRefId: row.pago_id ?? null,

    // extendidos no soportados por ahora
    createdAt: undefined,
    updatedAt: undefined,
    updatedBy: undefined,
    residentInfo: undefined,
    residentStatus: undefined,
    comments: undefined,
    trackingKey: undefined,
    breakdown: undefined,
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const [rows] = await pool.execute(
      `SELECT 
         pm.id,
         pm.monto,
         pm.fecha_vencimiento,
         pm.fecha_pago,
         pm.estado,
         pm.pago_id,
         pm.notas,
         pm.periodo_mes,
         pm.periodo_anio,
         u.id AS usuario_id,
         CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre
       FROM pagos_mantenimiento pm
       LEFT JOIN usuario_propiedad up ON up.propiedad_id = pm.propiedad_id
       LEFT JOIN usuarios u ON u.id = up.usuario_id
       WHERE pm.id = ?`,
      [params.id],
    )
    const row: any = Array.isArray(rows) ? (rows as any[])[0] : null
    if (!row) return NextResponse.json({ success: false, message: "No encontrado" }, { status: 404 })
    return NextResponse.json({ success: true, pago: mapRow(row) })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Error al obtener pago" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const fields = [
      "monto",
      "fecha_vencimiento",
      "fecha_pago",
      "pago_id",
      "notas",
      "periodo_mes",
      "periodo_anio",
    ] as const
    const sets: string[] = []
    const values: any[] = []
    for (const f of fields) {
      if (f in body) {
        sets.push(`${f} = ?`)
        values.push((body as any)[f])
      }
    }
    if ("estado" in body || "status" in body) {
      sets.push(`estado = ?`)
      values.push(mapAppStatusToDb((body as any).estado ?? (body as any).status))
    }
    if (sets.length === 0) return NextResponse.json({ success: false, message: "Sin cambios" }, { status: 400 })

    await pool.execute(`UPDATE pagos_mantenimiento SET ${sets.join(", ")} WHERE id = ?`, [...values, params.id])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Error al actualizar pago" }, { status: 500 })
  }
}
