import { NextResponse } from "next/server"
import pool from "@/lib/db"

// GET: lista de reportes por auxiliarId y/o condominioId
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const auxiliarId = searchParams.get("auxiliarId")
  const condominioId = searchParams.get("condominioId")

  let where = []
  let params: any[] = []
  if (auxiliarId) {
    where.push("auxiliar_id = ?")
    params.push(auxiliarId)
  }
  if (condominioId) {
    where.push("condominio_id = ?")
    params.push(condominioId)
  }
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : ""

  try {
    const [rows] = await pool.execute(
      `SELECT id, titulo, descripcion, auxiliar_id, condominio_id, seccion, estado, imagenes, created_at FROM reportes_mantenimiento ${whereClause} ORDER BY created_at DESC`,
      params
    )
    // imagenes es JSON en la BD
    const reportes = (rows as any[]).map(r => ({
      ...r,
      imagenes: r.imagenes ? JSON.parse(r.imagenes) : [],
    }))
    return NextResponse.json({ success: true, reportes })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al obtener reportes" }, { status: 500 })
  }
}

// POST: crear nuevo reporte
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { titulo, descripcion, auxiliarId, condominioId, seccion, estado = "pendiente", imagenes = [] } = body
    if (!titulo || !descripcion || !auxiliarId || !condominioId) {
      return NextResponse.json({ success: false, message: "Faltan campos obligatorios" }, { status: 400 })
    }
    const [result] = await pool.execute(
      `INSERT INTO reportes_mantenimiento (titulo, descripcion, auxiliar_id, condominio_id, seccion, estado, imagenes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [titulo, descripcion, auxiliarId, condominioId, seccion || null, estado, JSON.stringify(imagenes)]
    )
    return NextResponse.json({ success: true, id: (result as any).insertId })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al crear reporte" }, { status: 500 })
  }
}
