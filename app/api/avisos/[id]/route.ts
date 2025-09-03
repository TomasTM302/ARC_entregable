import { NextResponse } from "next/server"
import db from "@/lib/db"

import type { NextRequest } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  if (!id) return NextResponse.json({ success: false, error: "Falta el id" }, { status: 400 })
  try {
    const [rows] = await db.query("SELECT * FROM avisos WHERE id = ?", [id])
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Aviso no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ success: true, aviso: rows[0] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Error desconocido" }, { status: 500 })
  }
}

// PUT y otros métodos ya deben estar implementados para actualizar/eliminar
