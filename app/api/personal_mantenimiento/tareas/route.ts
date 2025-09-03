import { NextResponse } from "next/server"
import db from "@/lib/db"

// Mapas de enums entre UI y base de datos
const prioridadUiToDb: Record<string,string> = { low: 'baja', medium: 'media', high: 'alta' }
const prioridadDbToUi: Record<string,string> = { baja: 'low', media: 'medium', alta: 'high' }
const estadoUiToDb: Record<string,string> = { 'pending':'pendiente', 'in-progress':'in_progreso', 'completed':'completada', 'cancelled':'cancelada' }
const estadoDbToUi: Record<string,string> = { pendiente:'pending', in_progreso:'in-progress', completada:'completed', cancelada:'cancelled' }

function mapRow(row: any) {
  return {
    id: row.id,
    title: row.titulo,
    description: row.descripcion,
    status: estadoDbToUi[row.estado] ?? 'pending',
    priority: prioridadDbToUi[row.prioridad] ?? 'medium',
    assignedTo: row.auxiliar_id,
    assignedBy: row.creado_por,
    createdAt: row.fecha_creacion ? new Date(row.fecha_creacion).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    completedAt: row.fecha_completada ? new Date(row.fecha_completada).toISOString() : null,
    dueDate: row.fecha_vencimiento ? row.fecha_vencimiento : null,
    evidenceUrl: row.evidencia_url || null,
    notes: row.notas || null,
    condominiumId: row.condominio_id,
    sectionId: row.area_comun_id,
    isPersonalReminder: !!row.is_recordatorio,
  }
}

// GET /api/personal_mantenimiento/tareas
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const auxiliarId = searchParams.get('auxiliarId')
    const condominioId = searchParams.get('condominioId')
    const estado = searchParams.get('estado') // UI enum

    const where: string[] = []
    const params: any[] = []
    if (auxiliarId) { where.push('t.auxiliar_id = ?'); params.push(auxiliarId) }
    if (condominioId) { where.push('t.condominio_id = ?'); params.push(condominioId) }
    if (estado && estadoUiToDb[estado]) { where.push('t.estado = ?'); params.push(estadoUiToDb[estado]) }

    let sql = `SELECT t.* FROM tareas_mantenimiento t`
    if (where.length) sql += ' WHERE ' + where.join(' AND ')
    sql += ' ORDER BY t.fecha_creacion DESC'

    const [rows]: any = await db.query(sql, params)
    return NextResponse.json({ success: true, tareas: rows.map(mapRow) })
  } catch (err) {
    console.error('Error GET tareas mantenimiento:', err)
    return NextResponse.json({ success: false, message: 'Error al obtener tareas', error: String(err) }, { status: 500 })
  }
}

// POST /api/personal_mantenimiento/tareas (crear)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, description, assignedTo, assignedBy, priority='medium', condominiumId, sectionId, dueDate, isPersonalReminder=false, evidenceUrl } = body || {}

    if (!title || !assignedTo || !assignedBy) {
      return NextResponse.json({ success:false, message:'Faltan campos obligatorios (title, assignedTo, assignedBy)' }, { status:400 })
    }

    const prioridadDb = prioridadUiToDb[priority] || 'media'
    const estadoInicial = 'pendiente'

    const [result]: any = await db.query(
      `INSERT INTO tareas_mantenimiento (titulo, descripcion, auxiliar_id, creado_por, prioridad, estado, condominio_id, area_comun_id, fecha_vencimiento, evidencia_url)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [title, description || null, assignedTo, assignedBy, prioridadDb, estadoInicial, condominiumId || null, sectionId || null, dueDate || null, evidenceUrl || null]
    )

    const insertedId = result?.insertId
    if (!insertedId) return NextResponse.json({ success:false, message:'No se creó la tarea' }, { status:500 })

    const [rowFetch]: any = await db.query(`SELECT * FROM tareas_mantenimiento WHERE id = ?`, [insertedId])
    const tarea = rowFetch.length ? mapRow(rowFetch[0]) : null
    return NextResponse.json({ success:true, tarea })
  } catch (err) {
    console.error('Error POST tarea mantenimiento:', err)
    return NextResponse.json({ success:false, message:'Error al crear tarea', error:String(err) }, { status:500 })
  }
}

// PUT /api/personal_mantenimiento/tareas (actualizar)
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, title, description, priority, status, dueDate, notesAppend } = body || {}
    if (!id) return NextResponse.json({ success:false, message:'Falta id' }, { status:400 })

    const sets: string[] = []
    const params: any[] = []
    if (title !== undefined) { sets.push('titulo = ?'); params.push(title) }
    if (description !== undefined) { sets.push('descripcion = ?'); params.push(description || null) }
    if (priority && prioridadUiToDb[priority]) { sets.push('prioridad = ?'); params.push(prioridadUiToDb[priority]) }
    if (status && estadoUiToDb[status]) { sets.push('estado = ?'); params.push(estadoUiToDb[status]); if (status === 'completed') { sets.push('fecha_completada = NOW()') } }
    if (dueDate !== undefined) { sets.push('fecha_vencimiento = ?'); params.push(dueDate || null) }
    if (notesAppend) { sets.push("notas = CONCAT(IFNULL(notas,''), ?)"); params.push(`\n[${new Date().toISOString()}] ${notesAppend}`) }

    if (!sets.length) return NextResponse.json({ success:false, message:'Nada que actualizar' }, { status:400 })

    const sql = `UPDATE tareas_mantenimiento SET ${sets.join(', ')} WHERE id = ?`
    params.push(id)
    await db.query(sql, params)

    const [rowFetch]: any = await db.query(`SELECT * FROM tareas_mantenimiento WHERE id = ?`, [id])
    if (!rowFetch.length) return NextResponse.json({ success:false, message:'No encontrada' }, { status:404 })
    return NextResponse.json({ success:true, tarea: mapRow(rowFetch[0]) })
  } catch (err) {
    console.error('Error PUT tarea mantenimiento:', err)
    return NextResponse.json({ success:false, message:'Error al actualizar tarea', error:String(err) }, { status:500 })
  }
}

// DELETE /api/personal_mantenimiento/tareas?id=123
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success:false, message:'Falta id' }, { status:400 })
    await db.query(`DELETE FROM tareas_mantenimiento WHERE id = ?`, [id])
    return NextResponse.json({ success:true })
  } catch (err) {
    console.error('Error DELETE tarea mantenimiento:', err)
    return NextResponse.json({ success:false, message:'Error al eliminar tarea', error:String(err) }, { status:500 })
  }
}
