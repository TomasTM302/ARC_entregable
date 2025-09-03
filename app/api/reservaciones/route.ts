export async function GET() {
  try {
    const [rows]: any = await db.query("SELECT * FROM reservaciones")
    return NextResponse.json({ success: true, reservaciones: rows })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error al obtener reservaciones", error: (error as Error).message }, { status: 500 })
  }
}
import { NextResponse } from "next/server"
import db from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      usuario_id,
      area_comun_id,
      fecha_reservacion,
      hora_inicio,
      hora_fin,
      num_invitados,
      proposito,
      estado = "pendiente",
      fecha_solicitud = new Date().toISOString().slice(0, 19).replace("T", " "),
      tipo_pago = "tarjeta"
    } = body

    if (!usuario_id || !area_comun_id || !fecha_reservacion || !hora_inicio || !hora_fin) {
      return NextResponse.json({ success: false, message: "Faltan campos obligatorios" }, { status: 400 })
    }

    // Normalizar tipo_pago para que coincida con el ENUM
    let tipoPagoBD = "Tarjeta"
    if (typeof tipo_pago === "string") {
      if (tipo_pago.toLowerCase() === "tarjeta") tipoPagoBD = "Tarjeta"
      else if (tipo_pago.toLowerCase() === "transferencia") tipoPagoBD = "Transferencia"
      else if (tipo_pago.toLowerCase() === "efectivo") tipoPagoBD = "Efectivo"
    }

    const [result]: any = await db.execute(
      `INSERT INTO reservaciones (usuario_id, area_comun_id, fecha_reservacion, hora_inicio, hora_fin, num_invitados, proposito, estado, fecha_solicitud, tipo_pago)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, area_comun_id, fecha_reservacion, hora_inicio, hora_fin, num_invitados, proposito, estado, fecha_solicitud, tipoPagoBD]
    )

    return NextResponse.json({ success: true, message: "Reservación creada", id: result.insertId })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error al crear reservación", error: (error as Error).message }, { status: 500 })
  }
}
