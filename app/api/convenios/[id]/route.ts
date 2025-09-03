import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const body = await req.json()
    const fields = [
      "usuario_id",
      "descripcion",
      "monto_total",
      "num_pagos",
      "fecha_inicio",
      "estado",
      "notas",
    ] as const
    const sets: string[] = []
    const values: any[] = []
    for (const f of fields) {
      if (f in body) {
        sets.push(`${f} = ?`)
        values.push(body[f])
      }
    }
    if (sets.length === 0) return NextResponse.json({ success: false, message: "Sin cambios" }, { status: 400 })
    await pool.execute(`UPDATE convenios_pago SET ${sets.join(", ")} WHERE id = ?`, [...values, id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: "Error al actualizar convenio" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    await pool.execute(`DELETE FROM convenios_pago WHERE id = ?`, [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: "Error al eliminar convenio" }, { status: 500 })
  }
}
