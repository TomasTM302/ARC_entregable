import { NextResponse } from "next/server"
import db from "@/lib/db"

// Cache simple de columnas opcionales en multas
let HAS_MULTAS_PAID_COL: boolean | undefined
let HAS_MULTAS_ISSUED_COL: boolean | undefined

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = Number(searchParams.get("year") || new Date().getFullYear())
    const condominioId = searchParams.get("condominioId")

    // Inicializar arreglos de 12 meses (enero..diciembre)
    const zero12 = () => Array.from({ length: 12 }, () => 0)
    const maintenance = zero12()
    const fines = zero12()
  const commonAreas = zero12()
    const recovered = zero12()
    const advance = zero12()
  const agreements = zero12()
  const advanceCount = zero12()
  const others = zero12()
  const annualities = zero12()

    // Ingresos: pagos de mantenimiento (pagados) clasificados por tipo respecto al mes cobrado
    // 1) Cuota mensual: pagos cuyo periodo coincide con el mes de pago
    try {
      let sql = `
        SELECT MONTH(pm.fecha_pago) AS mes, SUM(pm.monto) AS total
        FROM pagos_mantenimiento pm`
      const params: any[] = []
      if (condominioId) {
        sql += `
          INNER JOIN propiedades p ON p.id = pm.propiedad_id
          WHERE pm.estado = 'pagado' AND YEAR(pm.fecha_pago) = ? AND p.condominio_id = ?
            AND pm.periodo_anio = YEAR(pm.fecha_pago) AND pm.periodo_mes = MONTH(pm.fecha_pago)`
        params.push(year, Number(condominioId))
      } else {
        sql += `
          WHERE pm.estado = 'pagado' AND YEAR(pm.fecha_pago) = ?
            AND pm.periodo_anio = YEAR(pm.fecha_pago) AND pm.periodo_mes = MONTH(pm.fecha_pago)`
        params.push(year)
      }
      sql += ` GROUP BY MONTH(pm.fecha_pago)`
      const [rows]: any = await db.query(sql, params)
      for (const r of rows || []) {
        const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
        maintenance[idx] += Number(r.total || 0)
      }
    } catch {}

    // 2) Recuperadas: pagos de periodos anteriores cobrados este mes
    try {
      let sql = `
        SELECT MONTH(pm.fecha_pago) AS mes, SUM(pm.monto) AS total
        FROM pagos_mantenimiento pm`
      const params: any[] = []
      if (condominioId) {
        sql += `
          INNER JOIN propiedades p ON p.id = pm.propiedad_id
          WHERE pm.estado = 'pagado' AND YEAR(pm.fecha_pago) = ? AND p.condominio_id = ?
            AND (pm.periodo_anio < YEAR(pm.fecha_pago) OR (pm.periodo_anio = YEAR(pm.fecha_pago) AND pm.periodo_mes < MONTH(pm.fecha_pago)))`
        params.push(year, Number(condominioId))
      } else {
        sql += `
          WHERE pm.estado = 'pagado' AND YEAR(pm.fecha_pago) = ?
            AND (pm.periodo_anio < YEAR(pm.fecha_pago) OR (pm.periodo_anio = YEAR(pm.fecha_pago) AND pm.periodo_mes < MONTH(pm.fecha_pago)))`
        params.push(year)
      }
      sql += ` GROUP BY MONTH(pm.fecha_pago)`
      const [rows]: any = await db.query(sql, params)
      for (const r of rows || []) {
        const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
        recovered[idx] += Number(r.total || 0)
      }
    } catch {}

    // 3) Adelantadas: pagos de periodos futuros cobrados este mes
    try {
      let sql = `
        SELECT MONTH(pm.fecha_pago) AS mes, SUM(pm.monto) AS total
        FROM pagos_mantenimiento pm`
      const params: any[] = []
      if (condominioId) {
        sql += `
          INNER JOIN propiedades p ON p.id = pm.propiedad_id
          WHERE pm.estado = 'pagado' AND YEAR(pm.fecha_pago) = ? AND p.condominio_id = ?
            AND (pm.periodo_anio > YEAR(pm.fecha_pago) OR (pm.periodo_anio = YEAR(pm.fecha_pago) AND pm.periodo_mes > MONTH(pm.fecha_pago)))`
        params.push(year, Number(condominioId))
      } else {
        sql += `
          WHERE pm.estado = 'pagado' AND YEAR(pm.fecha_pago) = ?
            AND (pm.periodo_anio > YEAR(pm.fecha_pago) OR (pm.periodo_anio = YEAR(pm.fecha_pago) AND pm.periodo_mes > MONTH(pm.fecha_pago)))`
        params.push(year)
      }
      sql += ` GROUP BY MONTH(pm.fecha_pago)`
      const [rows]: any = await db.query(sql, params)
      for (const r of rows || []) {
        const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
        advance[idx] += Number(r.total || 0)
      }
    } catch {}

    // Conteo de adelantos por mes de pago (para marcar anual o múltiples mensualidades)
    try {
      let sql = `
        SELECT MONTH(pm.fecha_pago) AS mes, COUNT(*) AS cnt
        FROM pagos_mantenimiento pm`
      const params: any[] = []
      if (condominioId) {
        sql += `
          INNER JOIN propiedades p ON p.id = pm.propiedad_id
          WHERE pm.estado = 'pagado' AND YEAR(pm.fecha_pago) = ? AND p.condominio_id = ?
            AND (pm.periodo_anio > YEAR(pm.fecha_pago)
                 OR (pm.periodo_anio = YEAR(pm.fecha_pago) AND pm.periodo_mes > MONTH(pm.fecha_pago)))`
        params.push(year, Number(condominioId))
      } else {
        sql += `
          WHERE pm.estado = 'pagado' AND YEAR(pm.fecha_pago) = ?
            AND (pm.periodo_anio > YEAR(pm.fecha_pago)
                 OR (pm.periodo_anio = YEAR(pm.fecha_pago) AND pm.periodo_mes > MONTH(pm.fecha_pago)))`
        params.push(year)
      }
      sql += ` GROUP BY MONTH(pm.fecha_pago)`
      const [rows]: any = await db.query(sql, params)
      for (const r of rows || []) {
        const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
        advanceCount[idx] = Number(r.cnt || 0)
      }
    } catch {}

    // Ingresos: multas pagadas (eficiente y robusto con/ sin propiedad ligada)
    try {
      if (typeof HAS_MULTAS_PAID_COL === 'undefined' || typeof HAS_MULTAS_ISSUED_COL === 'undefined') {
        try {
          const dbName = process.env.DB_NAME
          const [cols]: any = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'multas' AND COLUMN_NAME IN ('fecha_pago','fecha_emision')`,
            [dbName]
          )
          const set = new Set((cols || []).map((c: any) => String(c?.COLUMN_NAME || '').toLowerCase()))
          HAS_MULTAS_PAID_COL = set.has('fecha_pago')
          HAS_MULTAS_ISSUED_COL = set.has('fecha_emision')
        } catch {
          HAS_MULTAS_PAID_COL = false
          HAS_MULTAS_ISSUED_COL = false
        }
      }

      const dateExpr = HAS_MULTAS_PAID_COL && HAS_MULTAS_ISSUED_COL
        ? "COALESCE(m.fecha_pago, m.fecha_emision, m.fecha_vencimiento)"
        : HAS_MULTAS_PAID_COL
        ? "COALESCE(m.fecha_pago, m.fecha_vencimiento)"
        : HAS_MULTAS_ISSUED_COL
        ? "COALESCE(m.fecha_emision, m.fecha_vencimiento)"
        : "m.fecha_vencimiento"

      const start = `${year}-01-01`
      const end = `${year}-12-31`

      if (condominioId) {
        // 1) Multas con propiedad ligada directamente
        try {
          if (HAS_MULTAS_PAID_COL) {
            const sqlA = `
              SELECT MONTH(m.fecha_pago) AS mes, SUM(m.monto) AS total
              FROM multas m
              INNER JOIN propiedades p ON p.id = m.propiedad_id
              WHERE m.estado IN ('pagada','pagado')
                AND m.fecha_pago BETWEEN ? AND ?
                AND p.condominio_id = ?
              GROUP BY MONTH(m.fecha_pago)`
            const [rowsA]: any = await db.query(sqlA, [start, end, Number(condominioId)])
            for (const r of rowsA || []) {
              const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
              fines[idx] += Number(r.total || 0)
            }
          } else {
            const sqlA = `
              SELECT MONTH(${dateExpr}) AS mes, SUM(m.monto) AS total
              FROM multas m
              INNER JOIN propiedades p ON p.id = m.propiedad_id
              WHERE m.estado IN ('pagada','pagado')
                AND YEAR(${dateExpr}) = ?
                AND p.condominio_id = ?
              GROUP BY MONTH(${dateExpr})`
            const [rowsA]: any = await db.query(sqlA, [year, Number(condominioId)])
            for (const r of rowsA || []) {
              const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
              fines[idx] += Number(r.total || 0)
            }
          }
        } catch {}

        // 2) Multas sin propiedad: resolver propiedad del usuario vigente en la fecha del pago
        try {
          if (HAS_MULTAS_PAID_COL) {
            const sqlB = `
              SELECT MONTH(m.fecha_pago) AS mes, SUM(m.monto) AS total
              FROM multas m
              INNER JOIN usuario_propiedad up ON up.usuario_id = m.usuario_id
                AND up.fecha_inicio <= m.fecha_pago
                AND (up.fecha_fin IS NULL OR up.fecha_fin >= m.fecha_pago)
              INNER JOIN propiedades p ON p.id = up.propiedad_id
              WHERE m.propiedad_id IS NULL
                AND m.estado IN ('pagada','pagado')
                AND m.fecha_pago BETWEEN ? AND ?
                AND p.condominio_id = ?
              GROUP BY MONTH(m.fecha_pago)`
            const [rowsB]: any = await db.query(sqlB, [start, end, Number(condominioId)])
            for (const r of rowsB || []) {
              const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
              fines[idx] += Number(r.total || 0)
            }
          } else {
            const sqlB = `
              SELECT MONTH(${dateExpr}) AS mes, SUM(m.monto) AS total
              FROM multas m
              INNER JOIN usuario_propiedad up ON up.usuario_id = m.usuario_id
                AND up.fecha_inicio <= ${dateExpr}
                AND (up.fecha_fin IS NULL OR up.fecha_fin >= ${dateExpr})
              INNER JOIN propiedades p ON p.id = up.propiedad_id
              WHERE m.propiedad_id IS NULL
                AND m.estado IN ('pagada','pagado')
                AND YEAR(${dateExpr}) = ?
                AND p.condominio_id = ?
              GROUP BY MONTH(${dateExpr})`
            const [rowsB]: any = await db.query(sqlB, [year, Number(condominioId)])
            for (const r of rowsB || []) {
              const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
              fines[idx] += Number(r.total || 0)
            }
          }
        } catch {}
      } else {
        // Sin filtro de condominio: una sola consulta
        if (HAS_MULTAS_PAID_COL) {
          const sql = `
            SELECT MONTH(m.fecha_pago) AS mes, SUM(m.monto) AS total
            FROM multas m
            WHERE m.estado IN ('pagada','pagado')
              AND m.fecha_pago BETWEEN ? AND ?
            GROUP BY MONTH(m.fecha_pago)`
          const [rows]: any = await db.query(sql, [start, end])
          for (const r of rows || []) {
            const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
            fines[idx] += Number(r.total || 0)
          }
        } else {
          const sql = `
            SELECT MONTH(${dateExpr}) AS mes, SUM(m.monto) AS total
            FROM multas m
            WHERE m.estado IN ('pagada','pagado')
              AND YEAR(${dateExpr}) = ?
            GROUP BY MONTH(${dateExpr})`
          const [rows]: any = await db.query(sql, [year])
          for (const r of rows || []) {
            const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
            fines[idx] += Number(r.total || 0)
          }
        }
      }
    } catch (e) {
      // ignorar si no existe la tabla/columnas
    }

    // Convenios: pagos de convenios marcados como pagados
    // Se agrupan por mes de pago (o vencimiento si no hay fecha_pago)
    try {
      let convSql = `
        SELECT MONTH(COALESCE(pc.fecha_pago, pc.fecha_vencimiento)) AS mes, SUM(pc.monto) AS total
        FROM pagos_convenio pc
        INNER JOIN convenios_pago cp ON cp.id = pc.convenio_id`
      const convParams: any[] = []
      if (condominioId) {
        convSql += `
          LEFT JOIN usuario_propiedad up ON up.usuario_id = cp.usuario_id
            AND (up.fecha_fin IS NULL OR up.fecha_fin >= COALESCE(pc.fecha_pago, pc.fecha_vencimiento))
          LEFT JOIN propiedades p ON p.id = up.propiedad_id
          WHERE pc.estado = 'pagado'
            AND YEAR(COALESCE(pc.fecha_pago, pc.fecha_vencimiento)) = ?
            AND p.condominio_id = ?`
        convParams.push(year, Number(condominioId))
      } else {
        convSql += `
          WHERE pc.estado = 'pagado'
            AND YEAR(COALESCE(pc.fecha_pago, pc.fecha_vencimiento)) = ?`
        convParams.push(year)
      }
      convSql += ` GROUP BY MONTH(COALESCE(pc.fecha_pago, pc.fecha_vencimiento))`

      const [rows]: any = await db.query(convSql, convParams)
      for (const r of rows || []) {
        const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
        agreements[idx] += Number(r.total || 0)
      }
    } catch (e) {
      // ignorar si la tabla no existe
    }

    // Anualidades (cuotas amortizadas del mes): periodos del año actual cuyo pago fue en meses previos
    // Ej.: Periodo julio 2025 pagado en mayo 2025 (o 2024) -> cuenta como anualidad en julio 2025
    try {
      let anuSql = `
        SELECT pm.periodo_mes AS mes, SUM(pm.monto) AS total
        FROM pagos_mantenimiento pm`
      const anuParams: any[] = []
      if (condominioId) {
        anuSql += `
          INNER JOIN propiedades p ON p.id = pm.propiedad_id
          WHERE pm.estado = 'pagado' AND pm.periodo_anio = ? AND p.condominio_id = ?
            AND (pm.periodo_anio > YEAR(pm.fecha_pago)
                 OR (pm.periodo_anio = YEAR(pm.fecha_pago) AND pm.periodo_mes > MONTH(pm.fecha_pago)))`
        anuParams.push(year, Number(condominioId))
      } else {
        anuSql += `
          WHERE pm.estado = 'pagado' AND pm.periodo_anio = ?
            AND (pm.periodo_anio > YEAR(pm.fecha_pago)
                 OR (pm.periodo_anio = YEAR(pm.fecha_pago) AND pm.periodo_mes > MONTH(pm.fecha_pago)))`
        anuParams.push(year)
      }
      anuSql += ` GROUP BY pm.periodo_mes`
      const [rows]: any = await db.query(anuSql, anuParams)
      for (const r of rows || []) {
        const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
        annualities[idx] += Number(r.total || 0)
      }
    } catch (e) {
      // ignorar si la tabla no existe
    }

    // Áreas comunes: pagos generales completados por reservas (tipo = 'reserva')
    try {
      let areasSql = `
        SELECT MONTH(pg.fecha_pago) AS mes, SUM(pg.monto) AS total
        FROM pagos pg`
      const areasParams: any[] = []
      if (condominioId) {
        areasSql += `
          LEFT JOIN usuario_propiedad up ON up.usuario_id = pg.usuario_id
            AND (up.fecha_fin IS NULL OR up.fecha_fin >= pg.fecha_pago)
          LEFT JOIN propiedades pr ON pr.id = up.propiedad_id
          WHERE pg.estado = 'completado' AND pg.tipo = 'reserva'
            AND YEAR(pg.fecha_pago) = ? AND pr.condominio_id = ?`
        areasParams.push(year, Number(condominioId))
      } else {
        areasSql += `
          WHERE pg.estado = 'completado' AND pg.tipo = 'reserva'
            AND YEAR(pg.fecha_pago) = ?`
        areasParams.push(year)
      }
      areasSql += ` GROUP BY MONTH(pg.fecha_pago)`
      const [rows]: any = await db.query(areasSql, areasParams)
      for (const r of rows || []) {
        const idx = Math.max(1, Math.min(12, Number(r.mes))) - 1
        commonAreas[idx] += Number(r.total || 0)
      }
    } catch (e) {
      // ignorar si la tabla no existe
    }

    // TODO (opcional): otros ingresos si se definen fuentes reales

    return NextResponse.json({
      success: true,
    year,
  income: { maintenance, recovered, advance, fines, agreements, commonAreas, others, annualities },
  meta: { advanceCount },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Error" }, { status: 500 })
  }
}
