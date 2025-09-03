import { NextResponse } from "next/server"
import pool from "@/lib/db"

// POST: crear un registro 'atrasado' (monto 0) para el periodo (mes/año) de la propiedad del usuario
// Body: { userId: string, month: number, year: number, notes?: string }
export async function POST(req: Request) {
  try {
  const body = await req.json()
  console.log("[API][ATRASO][POST] body:", body)
    const userId = String(body?.userId || "")
    const month = Number(body?.month)
    const year = Number(body?.year)
    const notes = body?.notes ? String(body.notes) : "Generado al cobrar recargo por pago tardío"

    if (!userId || !month || !year) {
      return NextResponse.json({ success: false, message: "userId, month y year son obligatorios" }, { status: 400 })
    }

    // Obtener propiedad actual del usuario (última asignación)
    const [propRows]: any = await pool.execute(
    `SELECT up.propiedad_id
     FROM usuario_propiedad up
     WHERE up.usuario_id = ?
     ORDER BY (up.fecha_fin IS NULL OR up.fecha_fin >= CURDATE()) DESC, up.es_propietario DESC, up.fecha_inicio DESC, up.id DESC
     LIMIT 1`,
    [userId]
    )
    if (!Array.isArray(propRows) || propRows.length === 0) {
      return NextResponse.json({ success: false, message: "Propiedad no encontrada para el usuario" }, { status: 404 })
    }
    const propiedadId = propRows[0].propiedad_id

    // Evitar duplicados: si ya existe un registro atrasado para ese periodo/propiedad, no crear otro
    const [existsRows]: any = await pool.execute(
      `SELECT id FROM pagos_mantenimiento WHERE propiedad_id = ? AND periodo_mes = ? AND periodo_anio = ? AND estado = 'atrasado' LIMIT 1`,
      [propiedadId, month, year]
    )
    if (Array.isArray(existsRows) && existsRows.length > 0) {
      console.log("[API][ATRASO] already exists for:", { propiedadId, month, year })
      return NextResponse.json({ success: true, message: "Ya existe registro atrasado para este periodo" })
    }

    // Resolver cuota_id vigente para la propiedad
    let cuotaId: number | null = null
    try {
      const [prow]: any = await pool.execute(`SELECT condominio_id FROM propiedades WHERE id = ? LIMIT 1`, [propiedadId])
      const condoId = Array.isArray(prow) && prow.length ? prow[0].condominio_id : null
      if (condoId != null) {
        const [crow]: any = await pool.execute(
          `SELECT id FROM cuotas_mantenimiento WHERE condominio_id = ? ORDER BY fecha_inicio DESC, id DESC LIMIT 1`,
          [condoId]
        )
        if (Array.isArray(crow) && crow.length) cuotaId = Number(crow[0].id)
      }
      if (cuotaId == null) {
        const [crow2]: any = await pool.execute(`SELECT id FROM cuotas_mantenimiento ORDER BY fecha_inicio DESC, id DESC LIMIT 1`)
        if (Array.isArray(crow2) && crow2.length) cuotaId = Number(crow2[0].id)
      }
    } catch {}

    // Insertar registro con monto 0, estado 'atrasado'
    try {
      await pool.execute(
        `INSERT INTO pagos_mantenimiento (propiedad_id, cuota_id, periodo_mes, periodo_anio, monto, estado, notas)
         VALUES (?, ?, ?, ?, 0, 'atrasado', ?)`,
        [propiedadId, cuotaId, month, year, notes]
      )
    } catch {
      // Fallback sin cuota_id si la columna permite NULL
      await pool.execute(
        `INSERT INTO pagos_mantenimiento (propiedad_id, periodo_mes, periodo_anio, monto, estado, notas)
         VALUES (?, ?, ?, 0, 'atrasado', ?)`,
        [propiedadId, month, year, notes]
      )
    }
  console.log("[API][ATRASO] inserted atrasado:", { propiedadId, month, year })
  return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Error creando registro atrasado:", err)
    return NextResponse.json({ success: false, message: err?.message || "Error del servidor" }, { status: 500 })
  }
}
