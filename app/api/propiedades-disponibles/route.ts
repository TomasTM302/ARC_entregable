import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const condominioId = searchParams.get("condominioId")
  if (!condominioId) {
    return NextResponse.json({ success: false, message: "Falta condominioId" }, { status: 400 })
  }
  try {
    const [rows]: any = await pool.query(
      `SELECT p.id, p.numero
       FROM propiedades p
       LEFT JOIN usuario_propiedad up ON p.id = up.propiedad_id
       WHERE p.condominio_id = ? AND up.id IS NULL`,
      [condominioId]
    )
    return NextResponse.json({ success: true, propiedades: rows })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al obtener propiedades" }, { status: 500 })
  }
}
