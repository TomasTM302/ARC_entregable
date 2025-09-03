import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const condominioId = searchParams.get("condominio_id")

  if (!condominioId) {
    return NextResponse.json({ success: false, message: "Falta el parámetro condominio_id" }, { status: 400 })
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, nombre FROM secciones WHERE condominio_id = ?",
      [condominioId]
    )
    return NextResponse.json({ success: true, secciones: rows })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al obtener secciones" }, { status: 500 })
  }
}
