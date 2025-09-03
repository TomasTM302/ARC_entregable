import { NextResponse } from "next/server"
import db from "@/lib/db"

// GET: Listar usuarios de tipo residente
export async function GET() {
  try {
    // Filtrar por rol_id = 2 (residente)
    const [rows] = await db.query(`
      SELECT u.id, u.nombre, u.apellido, u.email, u.telefono,
             p.id AS propiedad_id, p.numero AS casa_numero
      FROM usuarios u
      INNER JOIN usuario_propiedad up ON u.id = up.usuario_id
      INNER JOIN propiedades p ON up.propiedad_id = p.id
      WHERE u.rol_id = 2
      ORDER BY u.nombre ASC
    `)
    // Si un usuario tiene varias propiedades, solo devolver la más reciente (por fecha de inicio)
    // Agrupar por usuario y quedarse con la propiedad de mayor up.id (última asignación)
    const usuariosMap = new Map()
    const arrRows = Array.isArray(rows) ? rows : []
    // Forzar tipado any para evitar errores de tipado
    const validRows = arrRows.filter((row) => (row as any) && typeof (row as any).id !== 'undefined') as any[]
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i] as any
      if (!usuariosMap.has(row.id) || (row.propiedad_id && row.propiedad_id > ((usuariosMap.get(row.id) as any)?.propiedad_id || 0))) {
        usuariosMap.set(row.id, row)
      }
    }
    const usuarios = Array.from(usuariosMap.values())
    return NextResponse.json({ success: true, usuarios })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al obtener usuarios residentes", error: String(err) }, { status: 500 })
  }
}
