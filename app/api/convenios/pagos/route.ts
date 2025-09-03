import { NextResponse } from "next/server"
import pool from "@/lib/db"

// GET /api/convenios/pagos?userId=&month=YYYY-MM&estado=
// Lista pagos de convenio (cuotas) con filtros opcionales
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const month = searchParams.get("month") // YYYY-MM
    const estado = searchParams.get("estado")

    const where: string[] = []
    const vals: any[] = []
    if (userId) { where.push("c.usuario_id = ?"); vals.push(userId) }
    if (month && /^\d{4}-\d{2}$/.test(month)) { where.push("DATE_FORMAT(pc.fecha_vencimiento, '%Y-%m') = ?"); vals.push(month) }
    if (estado) { where.push("pc.estado = ?"); vals.push(estado) }

    const sql = `SELECT 
      pc.id,
      pc.convenio_id       AS convenioId,
      pc.numero_pago       AS numeroPago,
      pc.monto             AS amount,
      pc.fecha_vencimiento AS dueDate,
      pc.fecha_pago        AS paidAt,
      pc.estado            AS status,
      pc.pago_id           AS pagoId,
      c.usuario_id         AS userId
    FROM pagos_convenio pc
    INNER JOIN convenios_pago c ON c.id = pc.convenio_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY pc.convenio_id ASC, pc.numero_pago ASC`

    const [rows] = await pool.query(sql, vals)
    return NextResponse.json({ success: true, pagos: rows })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Error al listar pagos de convenio' }, { status: 500 })
  }
}
