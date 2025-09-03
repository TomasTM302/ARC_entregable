import { NextResponse } from "next/server"
import pool from "@/lib/db"

// GET: listar convenios
export async function GET() {
  try {
    const [rows] = await pool.execute(`SELECT * FROM convenios_pago`)
    const convenios = Array.isArray(rows)
      ? (rows as any[]).map((row) => ({
          id: row.id,
          userId: row.usuario_id,
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
