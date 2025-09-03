import { NextResponse } from "next/server"
import pool from "@/lib/db"

// GET /api/pagos/general?estado=procesando&metodo=transferencia&tipo=mantenimiento&userId=123
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
  const estado = searchParams.get("estado")
    const metodo = searchParams.get("metodo")
    const tipo = searchParams.get("tipo")
    const userId = searchParams.get("userId")

    const where: string[] = []
    const vals: any[] = []
  if (estado) { where.push("p.estado = ?"); vals.push(estado) }
  if (metodo) { where.push("LOWER(p.metodo_pago) = LOWER(?)"); vals.push(metodo) }
    if (tipo) { where.push("p.tipo = ?"); vals.push(tipo) }
    if (userId) { where.push("p.usuario_id = ?"); vals.push(userId) }

    const sql = `
      SELECT p.id, p.usuario_id, p.referencia_id, p.tipo, p.monto, p.fecha_pago, p.metodo_pago, p.estado, p.notas,
             u.nombre, u.apellido
      FROM pagos p
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY p.fecha_pago DESC, p.id DESC`
    const [rows]: any = await pool.query(sql, vals)
    const pagos = (rows || []).map((r: any) => ({
      id: String(r.id),
      userId: r.usuario_id != null ? String(r.usuario_id) : "",
      userName: [r.nombre, r.apellido].filter(Boolean).join(" "),
      referenceId: r.referencia_id ?? null,
      type: r.tipo ?? null,
      amount: Number(r.monto ?? 0),
      paymentDate: r.fecha_pago ?? null,
      method: r.metodo_pago ?? null, // 'transferencia' | 'tarjeta' | 'efectivo' | 'cheque'
      status: r.estado ?? null, // 'pendiente'|'procesando'|'completado'|'rechazado'
      notes: r.notas ?? null,
    }))
    return NextResponse.json({ success: true, pagos })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Error al obtener pagos" }, { status: 500 })
  }
}
