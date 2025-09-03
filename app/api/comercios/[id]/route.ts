import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const body = await req.json()
    const fields = [
      "condominio_id",
      "nombre",
      "descripcion",
      "direccion",
      "telefono",
      "email",
      "sitio_web",
      "logo_url",
      "categoria",
      "descuento",
      "activo",
    ] as const
    const sets: string[] = []
    const values: any[] = []
    for (const f of fields) {
      if (f in body) {
        sets.push(`${f} = ?`)
        if (f === "activo") values.push(body[f] ? 1 : 0)
        else values.push(body[f])
      }
    }
    if (sets.length === 0) return NextResponse.json({ success: false, message: "Sin cambios" }, { status: 400 })
    await pool.execute(`UPDATE comercios SET ${sets.join(", ")} WHERE id = ?`, [...values, id])
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al actualizar comercio" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    await pool.execute(`DELETE FROM comercios WHERE id = ?`, [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al eliminar comercio" }, { status: 500 })
  }
}
