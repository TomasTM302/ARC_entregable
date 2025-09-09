import { NextResponse } from "next/server"
import db from "@/lib/db"

// GET /api/tareas_adm - lista todas las tareas administrativas
export async function GET(req: Request) {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.*, 
        ua.nombre  AS asignado_nombre,
        ua.apellido AS asignado_apellido,
        ua.email   AS asignado_email,
        uc.nombre  AS creador_nombre,
        uc.apellido AS creador_apellido,
        uc.email   AS creador_email
      FROM tareas_administrativas t
      LEFT JOIN usuarios ua ON ua.id = t.asignado_a
      LEFT JOIN usuarios uc ON uc.id = t.creado_por
      ORDER BY t.fecha_creacion DESC
    `)
    return NextResponse.json({ success: true, tareas: rows })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al obtener tareas", error: String(err) }, { status: 500 })
  }
}

// POST /api/tareas_adm - crea una nueva tarea administrativa
export async function POST(req: Request) {
  try {
  const body = await req.json()
    const {
      titulo,
      descripcion,
      asignado_a,
      creado_por,
      condominio_id,
      prioridad = "media",
      estado = "pendiente",
      fecha_vencimiento = null,
      notas = null,
      departamento = null
    } = body
    const result: any = await db.query(
      `INSERT INTO tareas_administrativas (
        titulo, descripcion, asignado_a, creado_por, condominio_id, prioridad, estado, fecha_vencimiento, notas, departamento
      ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        titulo,
        descripcion,
        asignado_a,
        creado_por,
        condominio_id,
        prioridad,
        estado,
        fecha_vencimiento,
        notas,
        departamento
      ]
    );
    // MySQL2: result[0].insertId
    const insertId = result?.[0]?.insertId ?? result?.insertId;
    return NextResponse.json({ success: true, id: insertId });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al crear tarea", error: String(err) }, { status: 500 })
  }
}

// PUT /api/tareas_adm?id=123 - actualiza una tarea administrativa
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ success: false, message: "Falta id" }, { status: 400 })
    const sets = []
    const params = []
    for (const key in fields) {
      sets.push(`${key} = ?`)
      params.push(fields[key])
    }
    if (!sets.length) return NextResponse.json({ success: false, message: "Nada que actualizar" }, { status: 400 })
    params.push(id)
    await db.query(`UPDATE tareas_administrativas SET ${sets.join(", ")} WHERE id = ?`, params)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al actualizar tarea", error: String(err) }, { status: 500 })
  }
}

// DELETE /api/tareas_adm?id=123 - elimina una tarea administrativa
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, message: "Falta id" }, { status: 400 })
    await db.query(`DELETE FROM tareas_administrativas WHERE id = ?`, [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al eliminar tarea", error: String(err) }, { status: 500 })
  }
}
