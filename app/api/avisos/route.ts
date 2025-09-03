export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM avisos ORDER BY fecha_publicacion DESC');
    return NextResponse.json({ success: true, avisos: rows });
  } catch (err) {
    console.error('Error al obtener avisos:', err);
    return NextResponse.json({ success: false, message: 'Error interno' }, { status: 500 });
  }
}
import { NextResponse } from "next/server"
import { createPool } from "mysql2/promise"

// Configuración de conexión (ajusta según tu entorno)
const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      titulo,
      contenido,
      autor_id,
      condominio_id,
      fecha_publicacion,
      fecha_expiracion,
      imagen_url,
      importante,
    } = body

    // Validación básica
    if (!titulo || !contenido || !autor_id || !condominio_id) {
      return NextResponse.json({ success: false, message: "Faltan campos obligatorios" }, { status: 400 })
    }

    // Validar el valor de importante
    const valoresImportantes = ['general', 'emergencia', 'mantenimiento', 'mascota_extraviada']
    const importanteFinal = valoresImportantes.includes(importante) ? importante : 'general'

    const [result] = await pool.execute(
      `INSERT INTO avisos (titulo, contenido, autor_id, condominio_id, fecha_publicacion, fecha_expiracion, imagen_url, importante)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo,
        contenido,
        autor_id,
        condominio_id,
        fecha_publicacion || new Date(),
        fecha_expiracion || null,
        imagen_url || null,
        importanteFinal,
      ]
    )

    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error("Error al guardar aviso:", err)
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 })
  }
}
