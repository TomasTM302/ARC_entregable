import { NextResponse } from "next/server"
import db from "@/lib/db"

// GET: Listar usuarios de tipo residente
export async function GET() {
  try {
    // Filtrar por rol_id = 2 (residente)
    const [rows] = await db.query(`
      SELECT u.id, u.nombre, u.apellido, u.email, u.telefono,
             up.id AS usuario_propiedad_id,
             p.id AS propiedad_id, p.numero AS casa_numero
      FROM usuarios u
      LEFT JOIN usuario_propiedad up ON u.id = up.usuario_id
      LEFT JOIN propiedades p ON up.propiedad_id = p.id
      WHERE u.rol_id = 2
      ORDER BY u.nombre ASC, up.fecha_inicio DESC, up.id DESC
    `)
    // Si un usuario tiene varias propiedades, quedarse con la asignación más reciente (primer registro tras ordenar)
    const usuariosMap = new Map()
    const arrRows = Array.isArray(rows) ? rows : []
    const validRows = arrRows.filter((row) => (row as any) && typeof (row as any).id !== 'undefined') as any[]
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i] as any
      if (!usuariosMap.has(row.id)) {
        usuariosMap.set(row.id, row)
      }
    }
    const usuarios = Array.from(usuariosMap.values()).map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      email: row.email,
      telefono: row.telefono,
      propiedad_id: row.propiedad_id ?? null,
      casa_numero: row.casa_numero ?? null,
    }))
    return NextResponse.json({ success: true, usuarios })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al obtener usuarios residentes", error: String(err) }, { status: 500 })
  }
}
