import { NextResponse } from "next/server"
import pool from "@/lib/db"

// Mapeos de valores BD (español) <-> App (inglés)
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
      return t // si ya viene en español u otro valor
  }
}

// Utilidad para mapear una fila SQL -> objeto normalizado (solo columnas seguras)
function mapRow(row: any) {
  return {
    id: String(row.id),
  // userId puede derivarse por join cuando se requiera
  userId: row.usuario_id != null ? String(row.usuario_id) : "",
  userName: row.usuario_nombre ?? "",
  amount: Number(row.monto ?? 0),
  paymentDate: row.fecha_pago ?? null,
  paymentMethod: null as any, // no existe en el esquema
  status: mapDbStatusToApp(row.estado),
  receiptUrl: null,
  notes: row.notas ?? null,
  month: Number(row.periodo_mes ?? row.mes ?? 0),
  year: Number(row.periodo_anio ?? row.anio ?? 0),
  dueDate: row.fecha_vencimiento ?? null,

    // Campos extendidos no presentes en BD actual: los dejamos undefined
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    // Auto-overdue: marcar como 'atrasado' todo pago de mantenimiento vencido y aún 'pendiente'
    try {
      await pool.execute(
        `UPDATE pagos_mantenimiento
         SET estado = 'atrasado'
         WHERE estado = 'pendiente'
           AND fecha_vencimiento IS NOT NULL
           AND fecha_vencimiento < CURDATE()`
      )
    } catch (e) {
      // log suave, no romper GET
      console.warn("[API][PAGOS][GET] auto-overdue update failed", e)
    }
    const where: string[] = []
    const vals: any[] = []
    const userId = searchParams.get("userId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const status = searchParams.get("status")
    if (userId) {
      where.push(
        "pm.propiedad_id IN (SELECT up.propiedad_id FROM usuario_propiedad up WHERE up.usuario_id = ?)"
      )
      vals.push(userId)
    }
    if (month) { where.push("pm.periodo_mes = ?"); vals.push(Number(month)) }
    if (year) { where.push("pm.periodo_anio = ?"); vals.push(Number(year)) }
    if (status) { where.push("pm.estado = ?"); vals.push(mapAppStatusToDb(status)) }

    // Solo columnas seguras + nombre de usuario por JOIN
    const sql = `
      SELECT 
        pm.id,
        pm.propiedad_id,
        pm.cuota_id,
        pm.periodo_mes,
        pm.periodo_anio,
        pm.monto,
        pm.fecha_vencimiento,
        pm.fecha_pago,
        pm.estado,
        pm.pago_id,
        pm.notas,
        u.id AS usuario_id,
        CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre
      FROM pagos_mantenimiento pm
      LEFT JOIN usuario_propiedad up ON up.propiedad_id = pm.propiedad_id
      LEFT JOIN usuarios u ON u.id = up.usuario_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY COALESCE(pm.fecha_vencimiento, pm.fecha_pago) DESC, pm.id DESC` as string

    const [rows] = await pool.execute(sql, vals)
    const pagos = Array.isArray(rows) ? (rows as any[]).map(mapRow) : []
    return NextResponse.json({ success: true, pagos })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Error al obtener pagos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
  const body = await req.json()
  console.log("[API][PAGOS][POST] body:", body)
    // Campos esperados para la tabla general `pagos`
    const usuario_id = body?.usuario_id
    const referencia_id = body?.referencia_id ?? null
    const tipo = body?.tipo ?? null // e.g., 'reserva', 'mantenimiento'
    const monto = body?.monto
    const metodo_pago = body?.metodo_pago // 'efectivo'|'transferencia'|'tarjeta'|'cheque'
    const estado = body?.estado // 'pendiente'|'procesando'|'completado'|'rechazado'
    const notas = body?.notas ?? null
    const fecha_pago = body?.fecha_pago ?? null

    if (!usuario_id || monto == null || !metodo_pago || !estado) {
      return NextResponse.json(
        { success: false, message: "usuario_id, monto, metodo_pago y estado son obligatorios" },
        { status: 400 },
      )
    }

  const [result]: any = await pool.execute(
      `INSERT INTO pagos (usuario_id, referencia_id, tipo, monto, fecha_pago, metodo_pago, estado, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id,
        referencia_id,
        tipo,
        monto,
        fecha_pago ?? new Date().toISOString().slice(0, 19).replace("T", " "),
        metodo_pago,
        estado,
        notas,
      ],
    )

  const [rows]: any = await pool.execute(`SELECT * FROM pagos WHERE id = ?`, [result.insertId])
  console.log("[API][PAGOS][POST] created id:", result.insertId)
    const pago = Array.isArray(rows) && rows.length ? rows[0] : null
    return NextResponse.json({ success: true, pago })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Error al crear pago" }, { status: 500 })
  }
}
 
