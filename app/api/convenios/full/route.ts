import { NextResponse } from "next/server"
import pool from "@/lib/db"

type CuotaItem = { numero_pago: number; monto: number; fecha_vencimiento: string }

// POST /api/convenios/full
// Crea un convenio y sus cuotas, y en el mismo flujo:
// - Cancela mensualidades de mantenimiento existentes seleccionadas (más antiguas)
// - Crea mensualidades faltantes como 'cancelado'
// Todo en una TRANSACTION para mantener consistencia.
export async function POST(req: Request) {
  const conn = await pool.getConnection()
  try {
    const body = await req.json()
    const usuarioId = String(body?.usuario_id || "")
    const mesesIncluir = Number(body?.meses_incluir || 0) // cuántas mensualidades se consolidan
    const numPagos = Number(body?.num_pagos || 0)
    const fechaInicioCuotas: string = body?.fecha_inicio_cuotas || new Date().toISOString().slice(0, 10)
    const recargoPercent: number = Number(body?.recargo_percent || 0)
    const cuotasCustom: CuotaItem[] | undefined = Array.isArray(body?.cuotas) ? body.cuotas : undefined

    if (!usuarioId || mesesIncluir <= 0 || numPagos <= 0) {
      return NextResponse.json({ success: false, message: "usuario_id, meses_incluir y num_pagos son requeridos" }, { status: 400 })
    }

    await conn.beginTransaction()

    // 1) Resolver propiedad_id del usuario (misma lógica que /api/pagos/mantenimiento)
    const [propRows]: any = await conn.execute(
      `SELECT up.propiedad_id
       FROM usuario_propiedad up
       WHERE up.usuario_id = ?
       ORDER BY (up.fecha_fin IS NULL OR up.fecha_fin >= CURDATE()) DESC,
                up.es_propietario DESC,
                up.fecha_inicio DESC,
                up.id DESC
       LIMIT 1`,
      [usuarioId],
    )
    if (!Array.isArray(propRows) || propRows.length === 0) {
      await conn.rollback();
      return NextResponse.json({ success: false, message: "Propiedad no encontrada para el usuario" }, { status: 404 })
    }
    const propiedadId = propRows[0].propiedad_id

    // 2) Obtener cuota vigente (monto y días de gracia) por condominio
    let cuotaId: number | null = null
    let cuotaMonto: number = 0
    let cuotaDiaGracia: number | null = null
    try {
      const [prow]: any = await conn.execute(`SELECT condominio_id FROM propiedades WHERE id = ? LIMIT 1`, [propiedadId])
      const condoId = Array.isArray(prow) && prow.length ? prow[0].condominio_id : null
      if (condoId != null) {
        const [crow]: any = await conn.execute(
          `SELECT id, monto, dias_gracia FROM cuotas_mantenimiento WHERE condominio_id = ? ORDER BY fecha_inicio DESC, id DESC LIMIT 1`,
          [condoId],
        )
        if (Array.isArray(crow) && crow.length) {
          cuotaId = Number(crow[0].id)
          cuotaMonto = Number(crow[0].monto ?? 0)
          cuotaDiaGracia = crow[0].dias_gracia != null ? Number(crow[0].dias_gracia) : null
        }
      }
      if (cuotaId == null) {
        const [crow2]: any = await conn.execute(
          `SELECT id, monto, dias_gracia FROM cuotas_mantenimiento ORDER BY fecha_inicio DESC, id DESC LIMIT 1`,
        )
        if (Array.isArray(crow2) && crow2.length) {
          cuotaId = Number(crow2[0].id)
          cuotaMonto = Number(crow2[0].monto ?? 0)
          cuotaDiaGracia = crow2[0].dias_gracia != null ? Number(crow2[0].dias_gracia) : null
        }
      }
    } catch {}

    // 3) Obtener fecha de alta del usuario para calcular periodos esperados
    let startDate: Date | null = null
    try {
      const [urows]: any = await conn.execute(`SELECT fecha_registro FROM usuarios WHERE id = ? LIMIT 1`, [usuarioId])
      if (Array.isArray(urows) && urows.length && urows[0].fecha_registro) {
        startDate = new Date(urows[0].fecha_registro)
      }
    } catch {}
    const now = new Date()
    const expectedMonths = startDate && !isNaN(startDate.getTime())
      ? (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()) + 1
      : 0

    // 4) Traer pagos existentes (cualquier estado) y también listas específicas
    const [allRows]: any = await conn.execute(
      `SELECT id, periodo_mes AS mes, periodo_anio AS anio, estado, monto
       FROM pagos_mantenimiento
       WHERE propiedad_id = ?`,
      [propiedadId],
    )
    const paidSet = new Set<string>(allRows.filter((r: any) => r.estado === 'pagado').map((r: any) => `${r.anio}-${r.mes}`))
    const existingSet = new Set<string>(allRows.map((r: any) => `${r.anio}-${r.mes}`))
    const pendList: Array<{ id: number; mes: number; anio: number; monto: number }> = (allRows as any[])
      .filter((r: any) => r.estado === 'pendiente' || r.estado === 'atrasado')
      .sort((a: any, b: any) => (a.anio - b.anio) || (a.mes - b.mes))

  // 5) Construir periodos faltantes (no existentes en absoluto) desde startDate hasta hoy
    const missing: Array<{ mes: number; anio: number }> = []
    if (expectedMonths > 0 && startDate) {
      for (let i = 0; i < expectedMonths; i++) {
        const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
        const y = d.getFullYear(), m = d.getMonth() + 1
        const key = `${y}-${m}`
    // Si ya existe cualquier registro para ese periodo (pagado/pendiente/atrasado/cancelado), NO lo recreamos
    if (!existingSet.has(key)) {
          missing.push({ anio: y, mes: m })
        }
      }
    }

    // 6) Elegir qué cancelar/crear según mesesIncluir (más antiguos primero)
    const toCancel = pendList.slice(0, Math.min(mesesIncluir, pendList.length))
    const needCreate = Math.max(0, mesesIncluir - toCancel.length)
    const toCreate = missing.slice(0, needCreate)

    // 7) Ejecutar cancelaciones/creaciones
    let baseSum = 0
    // Cancelar existentes -> estado 'cancelado'
    for (const r of toCancel) {
      baseSum += Number(r.monto || 0)
      await conn.execute(
        `UPDATE pagos_mantenimiento SET estado = 'cancelado', notas = CONCAT(COALESCE(notas,''), ?)
         WHERE id = ?`,
        [ ("\nIncluido en convenio de pago"), r.id ],
      )
    }
    // Crear faltantes como 'cancelado' con cuotaMonto, evitando duplicados si aparecieron en medio
    for (const r of toCreate) {
      const d = cuotaDiaGracia && cuotaDiaGracia > 0 && cuotaDiaGracia <= 28 ? new Date(r.anio, r.mes - 1, cuotaDiaGracia) : null
      const fechaV = d ? d.toISOString().slice(0, 10) : null
      baseSum += Number(cuotaMonto || 0)
      // Salvaguarda: si ya existe un registro (por carrera o por estado diferente), intentamos actualizar si no es 'pagado'; si no existe, insertamos
      const [existCheck]: any = await conn.execute(
        `SELECT id, estado FROM pagos_mantenimiento WHERE propiedad_id = ? AND periodo_mes = ? AND periodo_anio = ? LIMIT 1`,
        [propiedadId, r.mes, r.anio],
      )
      if (Array.isArray(existCheck) && existCheck.length) {
        if (existCheck[0].estado !== 'pagado') {
          await conn.execute(
            `UPDATE pagos_mantenimiento SET estado = 'cancelado', cuota_id = ?, monto = ?, fecha_vencimiento = ? WHERE id = ?`,
            [cuotaId, Number(cuotaMonto || 0), fechaV, existCheck[0].id],
          )
        }
      } else {
        await conn.execute(
          `INSERT INTO pagos_mantenimiento (propiedad_id, cuota_id, periodo_mes, periodo_anio, monto, fecha_vencimiento, estado)
           VALUES (?, ?, ?, ?, ?, ?, 'cancelado')`,
          [propiedadId, cuotaId, r.mes, r.anio, Number(cuotaMonto || 0), fechaV],
        )
      }
    }

    // 8) Determinar cuotas (personalizadas o divididas) y total del convenio
    let recargo = 0
    let totalConvenio = 0
    let items: CuotaItem[]
    if (cuotasCustom && cuotasCustom.length > 0) {
      items = cuotasCustom.map((c, ix) => ({
        numero_pago: c.numero_pago ?? (ix + 1),
        monto: Number(c.monto || 0),
        fecha_vencimiento: c.fecha_vencimiento,
      }))
      totalConvenio = Math.round((items.reduce((s, it) => s + Number(it.monto || 0), 0)) * 100) / 100
      recargo = 0 // si el usuario define cuotas, usamos su suma como total
    } else {
      recargo = Math.round(((baseSum * (recargoPercent || 0)) / 100) * 100) / 100
      totalConvenio = Math.round((baseSum + recargo) * 100) / 100
      const arr: CuotaItem[] = []
      const cuota = Math.round((totalConvenio / numPagos) * 100) / 100
      const start = new Date(fechaInicioCuotas)
      for (let i = 0; i < numPagos; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, start.getDate())
        arr.push({ numero_pago: i + 1, monto: cuota, fecha_vencimiento: d.toISOString().slice(0, 10) })
      }
      items = arr
    }

    // 9) Crear convenio principal usando el total calculado
    const descripcion = `Convenio ${numPagos} pagos` + (recargoPercent ? ` (incluye ${recargoPercent}% recargo)` : "")
    const notas = recargoPercent ? `Cotización con ${recargoPercent}% de recargo aplicado.` : null
    const [cres]: any = await conn.execute(
      `INSERT INTO convenios_pago (usuario_id, descripcion, monto_total, num_pagos, fecha_inicio, fecha_creacion, estado, notas)
       VALUES (?, ?, ?, ?, ?, NOW(), 'activo', ?)`,
      [usuarioId, descripcion, totalConvenio, numPagos, fechaInicioCuotas, notas],
    )
    const convenioId = Number(cres.insertId)

    // 10) Crear cuotas del convenio
    for (const it of items) {
      await conn.execute(
        `INSERT INTO pagos_convenio (convenio_id, numero_pago, monto, fecha_vencimiento, estado)
         VALUES (?, ?, ?, ?, 'pendiente')`,
        [convenioId, it.numero_pago, it.monto, it.fecha_vencimiento],
      )
    }

    await conn.commit()

    return NextResponse.json({
      success: true,
      convenio: { id: convenioId, usuario_id: usuarioId, monto_total: totalConvenio, num_pagos: numPagos, fecha_inicio: fechaInicioCuotas, estado: 'activo' },
      resumen: {
        base: baseSum,
        recargo: recargo,
        total: totalConvenio,
        cancelados_existentes: toCancel.length,
        creados_cancelado: toCreate.length,
      },
    })
  } catch (err: any) {
    try { await (conn as any).rollback() } catch {}
    console.error("[API][CONVENIOS][FULL] error:", err)
    return NextResponse.json({ success: false, message: err?.message || 'Error del servidor' }, { status: 500 })
  } finally {
    try { (conn as any).release() } catch {}
  }
}
