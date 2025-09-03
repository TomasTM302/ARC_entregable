import { NextResponse } from "next/server"
import db from "@/lib/db"
import { registrarLog } from "@/lib/logs"

// PUT: Actualizar datos bancarios de un condominio
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const {
      id, // id del condominio
      nombre_banco,
      nombre_titular,
      clave_inter,
      usuario_id // para logs
    } = body

    if (!id) {
      return NextResponse.json({ success: false, message: "Falta el id del condominio" }, { status: 400 })
    }

    // Obtener datos anteriores
    const [prevRows] = await db.query("SELECT nombre_banco, nombre_titular, clave_inter FROM condominios WHERE id = ?", [id])
    const datos_anteriores = prevRows && prevRows[0] ? prevRows[0] : null

    // Actualizar datos bancarios
    await db.query(
      `UPDATE condominios SET nombre_banco = ?, nombre_titular = ?, clave_inter = ? WHERE id = ?`,
      [nombre_banco, nombre_titular, clave_inter, id]
    )

    // Obtener datos nuevos
    const [rows] = await db.query("SELECT nombre_banco, nombre_titular, clave_inter FROM condominios WHERE id = ?", [id])
    const datos_nuevos = rows && rows[0] ? rows[0] : null

    // Registrar log del cambio
    await registrarLog({
      usuario_id,
      accion: "actualizar datos bancarios",
      tabla_afectada: "condominios",
      registro_afectado: id,
      datos_anteriores,
      datos_nuevos
    })

    return NextResponse.json({ success: true, datos: datos_nuevos })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al actualizar datos bancarios", error: String(err) }, { status: 500 })
  }
}
