import { NextResponse } from "next/server"
import pool from "@/lib/db"

// Cache simple para saber si existe la columna evidencia_url en la tabla multas
let HAS_EVIDENCE_COL: boolean | undefined
let HAS_PAID_COL: boolean | undefined
let HAS_ISSUED_COL: boolean | undefined

// GET: Listar multas con filtros opcionales: month (YYYY-MM), userId, estado
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month")
    const userId = searchParams.get("userId")
    const estado = searchParams.get("estado")

    // Descubrir una sola vez si existen columnas opcionales (evidencia_url, fecha_pago)
  if (typeof HAS_EVIDENCE_COL === "undefined" || typeof HAS_PAID_COL === "undefined" || typeof HAS_ISSUED_COL === "undefined") {
      try {
        const dbName = process.env.DB_NAME
        const [rows]: any = await pool.query(
          `SELECT COLUMN_NAME
           FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'multas' AND COLUMN_NAME IN ('evidencia_url','fecha_pago','fecha_emision')`,
          [dbName],
        )
        const names = new Set((rows || []).map((r: any) => String(r?.COLUMN_NAME || "").toLowerCase()))
        HAS_EVIDENCE_COL = names.has("evidencia_url")
        HAS_PAID_COL = names.has("fecha_pago")
    HAS_ISSUED_COL = names.has("fecha_emision")
      } catch {
        // Si falla el chequeo, asumir que no existen para no romper el GET
        if (typeof HAS_EVIDENCE_COL === "undefined") HAS_EVIDENCE_COL = false
        if (typeof HAS_PAID_COL === "undefined") HAS_PAID_COL = false
    if (typeof HAS_ISSUED_COL === "undefined") HAS_ISSUED_COL = false
      }
    }

    const params: any[] = []
    const where: string[] = ['u.rol_id = 2']
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const monthCol = HAS_ISSUED_COL ? 'm.fecha_emision' : 'm.fecha_vencimiento'
      where.push(`DATE_FORMAT(${monthCol}, '%Y-%m') = ?`)
      params.push(month)
    }
    if (userId) { where.push("m.usuario_id = ?"); params.push(userId) }
    if (estado) { where.push("m.estado = ?"); params.push(estado) }

  const evidenceSelect = HAS_EVIDENCE_COL ? `m.evidencia_url AS evidenceUrl,` : `NULL AS evidenceUrl,`
  const paidSelect = HAS_PAID_COL ? `m.fecha_pago AS paidAt,` : `NULL AS paidAt,`
  const issuedSelect = HAS_ISSUED_COL ? `m.fecha_emision AS issuedAt,` : `NULL AS issuedAt,`

  const orderByCol = HAS_ISSUED_COL ? 'm.fecha_emision' : 'm.fecha_vencimiento'
  const sql = `SELECT 
        m.id,
        m.usuario_id                AS userId,
        m.propiedad_id              AS propertyId,
        m.descripcion               AS reason,
        m.monto                     AS amount,
        ${issuedSelect}
  ${paidSelect}
        m.fecha_vencimiento         AS dueDate,
        m.estado                    AS status,
        ${evidenceSelect}
        m.notas                     AS notes,
        u.nombre                    AS userName,
        p.numero                    AS userHouse
      FROM multas m
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      LEFT JOIN propiedades p ON m.propiedad_id = p.id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY ${orderByCol} DESC`

    const [rows] = await pool.query(sql, params)
    return NextResponse.json({ success: true, multas: rows })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al obtener multas", error: String(err) }, { status: 500 })
  }
}

// POST: Crear nueva multa
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, reason, amount, dueDate } = body || {}
    if (!userId || !reason || amount == null || !dueDate) {
      return NextResponse.json({ success: false, message: "Faltan datos obligatorios" }, { status: 400 })
    }

    // Determinar propiedad principal del usuario
    const [propRows]: any = await pool.query(
      `SELECT p.id FROM propiedades p
       INNER JOIN usuario_propiedad up ON p.id = up.propiedad_id
       WHERE up.usuario_id = ?
       ORDER BY (up.fecha_fin IS NULL OR up.fecha_fin >= CURDATE()) DESC, up.es_propietario DESC, up.fecha_inicio DESC, up.id DESC
       LIMIT 1`,
      [userId],
    )
    if (!Array.isArray(propRows) || propRows.length === 0) {
      return NextResponse.json({ success: false, message: "El usuario no tiene una propiedad asignada" }, { status: 400 })
    }

    const monto = Number(amount)
    if (!Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json({ success: false, message: "Monto inválido" }, { status: 400 })
    }

    // Descubrir columnas opcionales si aún no lo hicimos en este proceso
    if (typeof HAS_ISSUED_COL === "undefined") {
      try {
        const dbName = process.env.DB_NAME
        const [rows]: any = await pool.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'multas' AND COLUMN_NAME = 'fecha_emision'`,
          [dbName],
        )
        HAS_ISSUED_COL = Array.isArray(rows) && rows.some((r: any) => String(r?.COLUMN_NAME || '').toLowerCase() === 'fecha_emision')
      } catch {
        HAS_ISSUED_COL = false
      }
    }

    let result: any
    if (HAS_ISSUED_COL) {
      ;[result] = await pool.query(
        `INSERT INTO multas (usuario_id, propiedad_id, descripcion, monto, fecha_vencimiento, estado, fecha_emision)
         VALUES (?, ?, ?, ?, ?, 'pendiente', NOW())`,
        [userId, propRows[0].id, reason, monto, dueDate],
      )
    } else {
      ;[result] = await pool.query(
        `INSERT INTO multas (usuario_id, propiedad_id, descripcion, monto, fecha_vencimiento, estado)
         VALUES (?, ?, ?, ?, ?, 'pendiente')`,
        [userId, propRows[0].id, reason, monto, dueDate],
      )
    }
    return NextResponse.json({ success: true, id: result?.insertId })
  } catch (err) {
    console.error("Error al crear multa:", err)
    return NextResponse.json({ success: false, message: "Error al crear la multa", error: String(err) }, { status: 500 })
  }
}

// PUT: actualizar estado/nota de una multa individual
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, estado, comentario } = body || {}
    if (!id) return NextResponse.json({ success: false, message: "Falta id" }, { status: 400 })
    if (estado && !["pendiente", "pagada", "cancelada"].includes(estado)) {
      return NextResponse.json({ success: false, message: "Estado inválido" }, { status: 400 })
    }
    if (!estado) return NextResponse.json({ success: false, message: "Nada que actualizar" }, { status: 400 })

    if (estado === "cancelada") {
      if (!comentario || !String(comentario).trim()) {
        return NextResponse.json({ success: false, message: "Se requiere un comentario para cancelar" }, { status: 400 })
      }
      await pool.query(
        `UPDATE multas SET estado = ?, notas = CONCAT(IFNULL(notas,''), ?) WHERE id = ?`,
        [estado, `\n[CANCELADA ${new Date().toISOString()}] ${String(comentario).trim()}`, id],
      )
    } else {
      await pool.query(`UPDATE multas SET estado = ? WHERE id = ?`, [estado, id])
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error al actualizar multa:", err)
    return NextResponse.json({ success: false, message: "Error al actualizar multa", error: String(err) }, { status: 500 })
  }
}

// PATCH: actualizar estado de varias multas en lote (marcar como pagadas/canceladas)
export async function PATCH(req: Request) {
  try {
  const body = await req.json()
  console.log("[API][MULTAS][PATCH] body:", body)
    const ids: any[] = Array.isArray(body?.ids) ? body.ids : []
    const estado = body?.estado
  const pagoId = body?.pago_id ?? null
    const notas = body?.notas ?? null
    if (ids.length === 0 || !estado) {
      return NextResponse.json({ success: false, message: "ids y estado son obligatorios" }, { status: 400 })
    }
    const now = new Date().toISOString().slice(0, 19).replace("T", " ")
    const setCols = ["estado = ?"]
    const setVals: any[] = [estado]
    // Verificar si existe la columna fecha_pago antes de usarla
  if (estado === "pagada") {
      if (typeof HAS_PAID_COL === "undefined") {
        try {
          const dbName = process.env.DB_NAME
          const [rows]: any = await pool.query(
            `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'multas' AND COLUMN_NAME = 'fecha_pago' LIMIT 1`,
            [dbName],
          )
          HAS_PAID_COL = Array.isArray(rows) && rows.length > 0
        } catch {
          HAS_PAID_COL = false
        }
      }
  if (HAS_PAID_COL) { setCols.push("fecha_pago = COALESCE(fecha_pago, ?)"); setVals.push(now) }
    }
    if (pagoId != null) { setCols.push("pago_id = ?"); setVals.push(pagoId) }
    if (notas != null) { setCols.push("notas = ?"); setVals.push(notas) }
  // Nota: la tabla 'multas' no tiene columna 'referencia_id'
  await pool.query(`UPDATE multas SET ${setCols.join(", ")} WHERE id IN (${ids.map(() => "?").join(", ")})`, [...setVals, ...ids])
  console.log("[API][MULTAS][PATCH] updated ids:", ids)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Error al actualizar multas" }, { status: 500 })
  }
}
