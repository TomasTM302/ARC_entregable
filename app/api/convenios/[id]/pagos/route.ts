import { NextResponse } from "next/server"
import pool from "@/lib/db"

// GET: listar pagos de un convenio
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    // Marcar automáticamente como 'atrasado' los pagos de convenio vencidos y aún 'pendiente'
    try {
      await pool.execute(
        `UPDATE pagos_convenio
         SET estado = 'atrasado'
         WHERE convenio_id = ? AND estado = 'pendiente' AND fecha_vencimiento IS NOT NULL AND fecha_vencimiento < CURDATE()`,
        [id]
      )
    } catch {}
    const [rows] = await pool.execute(
      `SELECT id, convenio_id, numero_pago, monto, fecha_vencimiento, fecha_pago, estado, pago_id
       FROM pagos_convenio WHERE convenio_id = ? ORDER BY numero_pago ASC`,
      [id],
    )
    const pagos = Array.isArray(rows)
      ? (rows as any[]).map((r) => ({
          id: r.id,
          convenioId: r.convenio_id,
          numeroPago: r.numero_pago,
          monto: Number(r.monto ?? 0),
          fechaVencimiento: r.fecha_vencimiento,
          fechaPago: r.fecha_pago,
          estado: r.estado,
          pagoId: r.pago_id,
        }))
      : []
    return NextResponse.json({ success: true, pagos })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: "Error al obtener pagos del convenio" }, { status: 500 })
  }
}

// POST: crear pagos en lote para un convenio
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const body = await req.json()
    const items: Array<{ numero_pago: number; monto: number; fecha_vencimiento: string }> = body?.items || []
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "items es requerido" }, { status: 400 })
    }

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      for (const it of items) {
        await conn.execute(
          `INSERT INTO pagos_convenio (convenio_id, numero_pago, monto, fecha_vencimiento, estado)
           VALUES (?, ?, ?, ?, 'pendiente')`,
          [id, it.numero_pago, it.monto, it.fecha_vencimiento],
        )
      }
      await conn.commit()
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: "Error al crear pagos del convenio" }, { status: 500 })
  }
}
