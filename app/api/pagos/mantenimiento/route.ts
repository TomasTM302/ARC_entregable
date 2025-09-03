import { NextResponse } from "next/server"
import pool from "@/lib/db"

// POST: Registra pagos de mantenimiento para uno o varios periodos (mes/año) del usuario
// Body: {
//   userId: string,
//   items: Array<{ month: number; year: number; amount: number }>,
//   pago_id?: number|string,
//   referencia_id?: string,
//   estado?: 'pagado'|'pendiente'|'procesando'|'atrasado'|'cancelado',
//   due_day?: number
// }
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("[API][MANTENIMIENTO][POST] body:", body)
    const userId = String(body?.userId || "")
    const items: Array<{ month: number; year: number; amount: number }> = Array.isArray(body?.items) ? body.items : []
    const pagoId = body?.pago_id ?? null
  // Nota: 'pagos_mantenimiento' no usa referencia_id en este esquema
    const estado: string = body?.estado || "pagado"
    const dueDay: number | null = body?.due_day != null ? Number(body.due_day) : null

    if (!userId || items.length === 0) {
      return NextResponse.json({ success: false, message: "userId e items son obligatorios" }, { status: 400 })
    }

    // Obtener propiedad actual del usuario: priorizar relación activa y es_propietario
    const [propRows]: any = await pool.execute(
      `SELECT up.propiedad_id
       FROM usuario_propiedad up
       WHERE up.usuario_id = ?
       ORDER BY (up.fecha_fin IS NULL OR up.fecha_fin >= CURDATE()) DESC, up.es_propietario DESC, up.fecha_inicio DESC, up.id DESC
       LIMIT 1`,
      [userId],
    )
    if (!Array.isArray(propRows) || propRows.length === 0) {
      return NextResponse.json({ success: false, message: "Propiedad no encontrada para el usuario" }, { status: 404 })
    }
    const propiedadId = propRows[0].propiedad_id

    // Resolver cuota_id vigente según el condominio de la propiedad
  let cuotaId: number | null = null
  let cuotaMonto: number | null = null
  let cuotaDiasGracia: number | null = null
    try {
      const [prow]: any = await pool.execute(`SELECT condominio_id FROM propiedades WHERE id = ? LIMIT 1`, [propiedadId])
      const condoId = Array.isArray(prow) && prow.length ? prow[0].condominio_id : null
      if (condoId != null) {
        const [crow]: any = await pool.execute(
          `SELECT id, monto, dias_gracia FROM cuotas_mantenimiento WHERE condominio_id = ? ORDER BY fecha_inicio DESC, id DESC LIMIT 1`,
          [condoId],
        )
        if (Array.isArray(crow) && crow.length) {
          cuotaId = Number(crow[0].id)
          cuotaMonto = Number(crow[0].monto ?? 0)
          cuotaDiasGracia = crow[0].dias_gracia != null ? Number(crow[0].dias_gracia) : null
        }
      }
      if (cuotaId == null) {
        const [crow2]: any = await pool.execute(
          `SELECT id, monto, dias_gracia FROM cuotas_mantenimiento ORDER BY fecha_inicio DESC, id DESC LIMIT 1`,
        )
        if (Array.isArray(crow2) && crow2.length) {
          cuotaId = Number(crow2[0].id)
          cuotaMonto = Number(crow2[0].monto ?? 0)
          cuotaDiasGracia = crow2[0].dias_gracia != null ? Number(crow2[0].dias_gracia) : null
        }
      }
    } catch {}

    const now = new Date().toISOString().slice(0, 19).replace("T", " ")
    const processed: Array<{ month: number; year: number; action: "insert" | "update" }> = []

    const dueDayFinal: number | null = dueDay != null ? dueDay : (cuotaDiasGracia != null ? cuotaDiasGracia : null)

  for (const it of items) {
      const month = Number(it.month)
      const year = Number(it.year)
      if (!month || !year) continue

      // fecha_vencimiento según dueDay (si se da), sino null
      let fechaVenc: string | null = null
      if (dueDayFinal && dueDayFinal > 0 && dueDayFinal <= 28) {
        const d = new Date(year, month - 1, dueDayFinal)
        fechaVenc = d.toISOString().slice(0, 10)
      }

      // upsert por (propiedad_id, periodo)
      const [exists]: any = await pool.execute(
        `SELECT id FROM pagos_mantenimiento WHERE propiedad_id = ? AND periodo_mes = ? AND periodo_anio = ? LIMIT 1`,
        [propiedadId, month, year],
      )
    if (Array.isArray(exists) && exists.length > 0) {
        const id = exists[0].id
  console.log("[API][MANTENIMIENTO] update existing:", { id, month, year, estado, pagoId, cuotaId })
        try {
      const amountProvided = Number(it.amount)
      const finalAmount = isFinite(amountProvided) && amountProvided > 0 ? amountProvided : (cuotaMonto != null ? cuotaMonto : 0)
          if (estado === "pagado") {
            await pool.execute(
              `UPDATE pagos_mantenimiento 
               SET monto = ?, estado = ?, fecha_pago = ?, pago_id = ?, cuota_id = COALESCE(cuota_id, ?), fecha_vencimiento = COALESCE(fecha_vencimiento, ?) 
               WHERE id = ?`,
        [finalAmount, estado, now, pagoId, cuotaId, fechaVenc, id],
            )
          } else {
            await pool.execute(
              `UPDATE pagos_mantenimiento 
               SET monto = ?, estado = ?, pago_id = ?, cuota_id = COALESCE(cuota_id, ?), fecha_vencimiento = COALESCE(fecha_vencimiento, ?) 
               WHERE id = ?`,
        [finalAmount, estado, pagoId, cuotaId, fechaVenc, id],
            )
          }
        } catch (e) {}
        processed.push({ month, year, action: "update" })
      } else {
  console.log("[API][MANTENIMIENTO] insert new:", { propiedadId, month, year, estado, pagoId, cuotaId })
        try {
      const amountProvided = Number(it.amount)
      const finalAmount = isFinite(amountProvided) && amountProvided > 0 ? amountProvided : (cuotaMonto != null ? cuotaMonto : 0)
          if (estado === "pagado") {
            await pool.execute(
              `INSERT INTO pagos_mantenimiento (propiedad_id, cuota_id, periodo_mes, periodo_anio, monto, fecha_vencimiento, fecha_pago, estado, pago_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [propiedadId, cuotaId, month, year, finalAmount, fechaVenc, now, estado, pagoId],
            )
          } else {
            await pool.execute(
              `INSERT INTO pagos_mantenimiento (propiedad_id, cuota_id, periodo_mes, periodo_anio, monto, fecha_vencimiento, estado, pago_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [propiedadId, cuotaId, month, year, finalAmount, fechaVenc, estado, pagoId],
            )
          }
        } catch (e) {
      const amountProvided2 = Number(it.amount)
      const finalAmount2 = isFinite(amountProvided2) && amountProvided2 > 0 ? amountProvided2 : (cuotaMonto != null ? cuotaMonto : 0)
          if (estado === "pagado") {
            await pool.execute(
              `INSERT INTO pagos_mantenimiento (propiedad_id, cuota_id, periodo_mes, periodo_anio, monto, fecha_vencimiento, fecha_pago, estado, pago_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [propiedadId, cuotaId, month, year, finalAmount2, fechaVenc, now, estado, pagoId],
            )
          } else {
            await pool.execute(
              `INSERT INTO pagos_mantenimiento (propiedad_id, cuota_id, periodo_mes, periodo_anio, monto, fecha_vencimiento, estado, pago_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [propiedadId, cuotaId, month, year, finalAmount2, fechaVenc, estado, pagoId],
            )
          }
        }
        processed.push({ month, year, action: "insert" })
      }
    }

    console.log("[API][MANTENIMIENTO][POST] processed:", processed)
    // Crear automáticamente el cobro del siguiente mes como 'pendiente'
    try {
      if (processed.length > 0) {
        // Tomar el periodo más futuro procesado
        const last = processed.reduce((acc, cur) => {
          if (!acc) return cur
          const accKey = acc.year * 100 + acc.month
          const curKey = cur.year * 100 + cur.month
          return curKey > accKey ? cur : acc
        }) as { month: number; year: number }
        let nMonth = last.month + 1
        let nYear = last.year
        if (nMonth > 12) { nMonth = 1; nYear += 1 }

        // Vencimiento para el siguiente mes
        let nextFechaVenc: string | null = null
        if (dueDayFinal && dueDayFinal > 0 && dueDayFinal <= 28) {
          const d = new Date(nYear, nMonth - 1, dueDayFinal)
          nextFechaVenc = d.toISOString().slice(0, 10)
        }

        // Verificar si ya existe
        const [existsNext]: any = await pool.execute(
          `SELECT id FROM pagos_mantenimiento WHERE propiedad_id = ? AND periodo_mes = ? AND periodo_anio = ? LIMIT 1`,
          [propiedadId, nMonth, nYear]
        )
        if (!Array.isArray(existsNext) || existsNext.length === 0) {
          const nextAmount = cuotaMonto != null ? cuotaMonto : (Number(items[items.length - 1]?.amount || 0))
          await pool.execute(
            `INSERT INTO pagos_mantenimiento (propiedad_id, cuota_id, periodo_mes, periodo_anio, monto, fecha_vencimiento, estado)
             VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
            [propiedadId, cuotaId, nMonth, nYear, nextAmount, nextFechaVenc]
          )
          console.log("[API][MANTENIMIENTO][POST] auto-created next month pending:", { propiedadId, nMonth, nYear })
        }
      }
    } catch (e) {
      console.warn("[API][MANTENIMIENTO][POST] could not auto-create next month pending", e)
    }

    return NextResponse.json({ success: true, processed })
  } catch (err: any) {
    console.error("Error registrando pagos de mantenimiento:", err)
    return NextResponse.json({ success: false, message: err?.message || "Error del servidor" }, { status: 500 })
  }
}
