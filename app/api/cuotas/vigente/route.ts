import { NextResponse } from "next/server"
import pool from "@/lib/db"

// GET /api/cuotas/vigente?userId=123
// Devuelve el día de pago (dias_gracia) vigente de la cuota de mantenimiento para el usuario.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ success: false, message: "userId es requerido" }, { status: 400 })
    }

    // Resolver propiedad del usuario
    const [propRows]: any = await pool.execute(
      `SELECT up.propiedad_id
       FROM usuario_propiedad up
       WHERE up.usuario_id = ?
       ORDER BY (up.fecha_fin IS NULL OR up.fecha_fin >= CURDATE()) DESC,
                up.es_propietario DESC,
                up.fecha_inicio DESC,
                up.id DESC
       LIMIT 1`,
      [userId],
    )
    if (!Array.isArray(propRows) || propRows.length === 0) {
      return NextResponse.json({ success: false, message: "Propiedad no encontrada" }, { status: 404 })
    }
    const propiedadId = propRows[0].propiedad_id

    // Obtener condominio
    const [prow]: any = await pool.execute(`SELECT condominio_id FROM propiedades WHERE id = ? LIMIT 1`, [propiedadId])
    const condoId = Array.isArray(prow) && prow.length ? prow[0].condominio_id : null
    if (condoId == null) {
      return NextResponse.json({ success: true, dia_pago: null })
    }

    // Ultima cuota por condominio
    const [crow]: any = await pool.execute(
      `SELECT id, monto, dias_gracia
       FROM cuotas_mantenimiento
       WHERE condominio_id = ?
       ORDER BY fecha_inicio DESC, id DESC
       LIMIT 1`,
      [condoId],
    )
    if (Array.isArray(crow) && crow.length) {
      const dia = crow[0].dias_gracia != null ? Number(crow[0].dias_gracia) : null
      return NextResponse.json({ success: true, dia_pago: dia })
    }

    // Fallback global
    const [crow2]: any = await pool.execute(
      `SELECT id, monto, dias_gracia FROM cuotas_mantenimiento ORDER BY fecha_inicio DESC, id DESC LIMIT 1`,
    )
    if (Array.isArray(crow2) && crow2.length) {
      const dia = crow2[0].dias_gracia != null ? Number(crow2[0].dias_gracia) : null
      return NextResponse.json({ success: true, dia_pago: dia })
    }

    return NextResponse.json({ success: true, dia_pago: null })
  } catch (err) {
    console.error("[API][CUOTAS][VIGENTE]", err)
    return NextResponse.json({ success: false, message: "Error del servidor" }, { status: 500 })
  }
}
