import { NextResponse } from "next/server"
import db from "@/lib/db"

// GET: Recuperar todas las cuotas de mantenimiento
export async function GET() {
  try {
    // Recuperar todas las cuotas de mantenimiento
    const [cuotas] = await db.query("SELECT * FROM cuotas_mantenimiento")
    return NextResponse.json({ success: true, cuotas })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al recuperar cuotas", error: String(err) }, { status: 500 })
  }
}

// PUT: Actualizar una cuota de mantenimiento existente
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const {
      id,
      condominio_id,
      monto,
      recargo_porcentaje,
      dias_gracia,
      usuario_id // lo recibimos del frontend
    } = body

    if (!id) {
      return NextResponse.json({ success: false, message: "Falta el id de la cuota" }, { status: 400 })
    }

    // Obtener datos anteriores
    const [prevRows] = await db.query("SELECT * FROM cuotas_mantenimiento WHERE id = ?", [id])
    const datos_anteriores = prevRows.length > 0 ? JSON.stringify(prevRows[0]) : null

    // Actualizar cuota
    await db.query(
      `UPDATE cuotas_mantenimiento SET condominio_id = ?, monto = ?, recargo_porcentaje = ?, dias_gracia = ? WHERE id = ?`,
      [condominio_id, monto, recargo_porcentaje, dias_gracia, id]
    )
    // Recuperar la cuota actualizada
    const [rows] = await db.query("SELECT * FROM cuotas_mantenimiento WHERE id = ?", [id])
    const datos_nuevos = rows.length > 0 ? JSON.stringify(rows[0]) : null

    // Registrar log del cambio
    await db.query(
      `INSERT INTO logs_sistema (usuario_id, accion, tabla_afectada, registro_afectado, datos_anteriores, datos_nuevos) VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, "actualizar cuota", "cuotas_mantenimiento", id, datos_anteriores, datos_nuevos]
    )

    return NextResponse.json({ success: true, cuota: rows[0] })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al actualizar cuota", error: String(err) }, { status: 500 })
  }
}
