import { NextResponse } from "next/server"
import pool from "@/lib/db"

// GET: listar convenios
export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        cp.*,
        u.nombre AS user_nombre,
        u.apellido AS user_apellido,
        (
          SELECT p.numero
          FROM usuario_propiedad up
          JOIN propiedades p ON p.id = up.propiedad_id
          WHERE up.usuario_id = cp.usuario_id
          ORDER BY (up.fecha_fin IS NULL OR up.fecha_fin >= CURDATE()) DESC,
                   up.fecha_inicio DESC,
                   up.id DESC
          LIMIT 1
        ) AS user_house
      FROM convenios_pago cp
      LEFT JOIN usuarios u ON u.id = cp.usuario_id
      ORDER BY cp.fecha_creacion DESC, cp.id DESC
    `)
    const convenios = Array.isArray(rows)
      ? (rows as any[]).map((row) => ({
          id: row.id,
          userId: row.usuario_id,
          userName: [row.user_nombre, row.user_apellido].filter(Boolean).join(' ').trim(),
          userHouse: row.user_house ?? '',
          description: row.descripcion ?? null,
          totalAmount: Number(row.monto_total ?? 0),
          numPayments: Number(row.num_pagos ?? 0),
          startDate: row.fecha_inicio,
          createdAt: row.fecha_creacion,
          status: row.estado ?? null,
          notes: row.notas ?? null,

          // originales
          usuario_id: row.usuario_id,
          descripcion: row.descripcion,
          monto_total: row.monto_total,
          num_pagos: row.num_pagos,
          fecha_inicio: row.fecha_inicio,
          fecha_creacion: row.fecha_creacion,
          estado: row.estado,
          notas: row.notas,
        }))
      : []
    return NextResponse.json({ success: true, convenios })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: "Error al obtener convenios" }, { status: 500 })
  }
}

// POST: crear convenio
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      usuario_id,
      descripcion = null,
      monto_total,
      num_pagos,
      fecha_inicio,
      estado = "activo",
      notas = null,
    } = body

    if (!usuario_id || monto_total == null || num_pagos == null || !fecha_inicio) {
      return NextResponse.json(
        { success: false, message: "usuario_id, monto_total, num_pagos y fecha_inicio son obligatorios" },
        { status: 400 },
      )
    }

    const [result]: any = await pool.execute(
      `INSERT INTO convenios_pago (usuario_id, descripcion, monto_total, num_pagos, fecha_inicio, fecha_creacion, estado, notas)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [usuario_id, descripcion, monto_total, num_pagos, fecha_inicio, estado, notas],
    )

    const [rows] = await pool.execute(`SELECT * FROM convenios_pago WHERE id = ?`, [result.insertId])
    const row: any = Array.isArray(rows) ? (rows as any[])[0] : null
    if (!row) return NextResponse.json({ success: false, message: "No se pudo recuperar el convenio creado" }, { status: 500 })

    const convenio = {
      id: row.id,
      userId: row.usuario_id,
      description: row.descripcion,
      totalAmount: Number(row.monto_total ?? 0),
      numPayments: Number(row.num_pagos ?? 0),
      startDate: row.fecha_inicio,
      createdAt: row.fecha_creacion,
      status: row.estado,
      notes: row.notas,
    }
    return NextResponse.json({ success: true, convenio })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: "Error al crear convenio" }, { status: 500 })
  }
}
