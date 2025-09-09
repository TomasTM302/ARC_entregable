import { NextResponse } from "next/server"
import db from "@/lib/db"
import { google } from "googleapis"
import { Readable } from "stream"

export const runtime = "nodejs"

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

// --- Helpers para subir evidencia a Google Drive cuando llega como data URL ---
const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder"
function required(name: string, value?: string) {
  if (!value) throw new Error(`Falta variable de entorno: ${name}`)
  return value
}

function getOAuthDriveClientStrict() {
  const clientId = required("GOOGLE_OAUTH_CLIENT_ID", process.env.GOOGLE_OAUTH_CLIENT_ID)
  const clientSecret = required("GOOGLE_OAUTH_CLIENT_SECRET", process.env.GOOGLE_OAUTH_CLIENT_SECRET)
  const refreshToken = required("GOOGLE_OAUTH_REFRESH_TOKEN", process.env.GOOGLE_OAUTH_REFRESH_TOKEN)
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
  oauth2.setCredentials({ refresh_token: refreshToken })
  return google.drive({ version: "v3", auth: oauth2 })
}

async function ensureFolderPath(drive: any, baseParentId: string, folderPath: string) {
  const segments = folderPath
    .split(/[\\\/]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  let parentId = baseParentId
  for (const name of segments) {
    const q = `'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='${DRIVE_FOLDER_MIME}' and trashed=false`
    const list = await drive.files.list({
      q,
      fields: "files(id,name)",
      pageSize: 1,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      spaces: "drive",
    })
    let id = list.data.files?.[0]?.id
    if (!id) {
      const created = await drive.files.create({
        requestBody: { name, mimeType: DRIVE_FOLDER_MIME, parents: [parentId] },
        fields: "id",
        supportsAllDrives: true,
      })
      id = created.data.id!
    }
    parentId = id
  }
  return parentId
}

async function uploadEvidenceDataUrl(dataUrl: string, suggestedName = "evidencia") {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/)
  if (!match) throw new Error("Formato de evidencia no válido (se esperaba data URL base64)")
  const mime = match[1] || "application/octet-stream"
  const base64 = match[2]
  const buffer = Buffer.from(base64, "base64")
  const ext = mime.split("/")[1] || "bin"
  const timestamp = Date.now()
  const fileName = `${timestamp}_${suggestedName.replace(/\s+/g, "_")}.${ext}`

  const drive = getOAuthDriveClientStrict()
  const baseParentId = required("GOOGLE_DRIVE_PARENT_FOLDER_ID", process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID)
  const parentId = await ensureFolderPath(drive, baseParentId, "mantenimiento/evidencias")

  const created = await drive.files.create({
    requestBody: { name: fileName, parents: [parentId] },
    media: { mimeType: mime, body: Readable.from(buffer) } as any,
    fields: "id",
    supportsAllDrives: true,
  })
  const fileId = created.data.id as string

  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    })
  } catch {
    // ignorar si no se puede hacer público
  }
  return `https://drive.google.com/uc?id=${fileId}`
}

async function uploadEvidenceFromBase64Payload(base64: string, suggestedName = "evidencia", mime = "image/jpeg") {
  const buffer = Buffer.from(base64, "base64")
  const ext = mime.split("/")[1] || "bin"
  const timestamp = Date.now()
  const fileName = `${timestamp}_${suggestedName.replace(/\s+/g, "_")}.${ext}`

  const drive = getOAuthDriveClientStrict()
  const baseParentId = required("GOOGLE_DRIVE_PARENT_FOLDER_ID", process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID)
  const parentId = await ensureFolderPath(drive, baseParentId, "mantenimiento/evidencias")

  const created = await drive.files.create({
    requestBody: { name: fileName, parents: [parentId] },
    media: { mimeType: mime, body: Readable.from(buffer) } as any,
    fields: "id",
    supportsAllDrives: true,
  })
  const fileId = created.data.id as string
  try {
    await drive.permissions.create({ fileId, requestBody: { role: "reader", type: "anyone" }, supportsAllDrives: true })
  } catch {}
  return `https://drive.google.com/uc?id=${fileId}`
}

function isHttpUrl(s: string) {
  return /^https?:\/\//i.test(s)
}

function isDataUrl(s: string) {
  return /^data:[^;]+;base64,/i.test(s)
}

function isLikelyBase64Payload(s: string) {
  // Grandes, solo caracteres base64, sin esquema http(s)
  if (isHttpUrl(s) || isDataUrl(s)) return false
  if (s.length < 100) return false
  return /^[A-Za-z0-9+/=\r\n]+$/.test(s)
}

// GET /api/personal_mantenimiento/tareas
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const auxiliarId = searchParams.get('auxiliarId')
    const condominioId = searchParams.get('condominioId')
    const estado = searchParams.get('estado') // UI enum
  const start = searchParams.get('start') // YYYY-MM-DD
  const end = searchParams.get('end')     // YYYY-MM-DD

    const where: string[] = []
    const params: any[] = []
    if (auxiliarId) { where.push('t.auxiliar_id = ?'); params.push(auxiliarId) }
    if (condominioId) { where.push('t.condominio_id = ?'); params.push(condominioId) }
    if (estado && estadoUiToDb[estado]) { where.push('t.estado = ?'); params.push(estadoUiToDb[estado]) }
  if (start) { where.push('t.fecha_creacion >= ?'); params.push(`${start} 00:00:00`) }
  if (end) { where.push('t.fecha_creacion < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(`${end} 00:00:00`) }

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
  const { title, description, assignedTo, assignedBy, priority='medium', condominiumId, sectionId, dueDate, isPersonalReminder=false, evidenceUrls } = body || {}
  // Permitir status (UI: pending|in-progress|completed|cancelled) o estado (DB: pendiente|in_progreso|completada|cancelada)
  const incomingStatus: string | undefined = (body && (body.status as string)) || undefined
  const incomingEstadoDb: string | undefined = (body && (body.estado as string)) || undefined
  let { evidenceUrl } = body || {}

    if (!title || !assignedTo || !assignedBy) {
      return NextResponse.json({ success:false, message:'Faltan campos obligatorios (title, assignedTo, assignedBy)' }, { status:400 })
    }

    const prioridadDb = prioridadUiToDb[priority] || 'media'
    // Regla: por solicitud, crear tareas en estado "completada" por defecto, salvo que se indique otro estado válido
    let estadoInicial: string | undefined
    if (incomingStatus && estadoUiToDb[incomingStatus]) {
      estadoInicial = estadoUiToDb[incomingStatus]
    } else if (incomingEstadoDb && ['pendiente','in_progreso','completada','cancelada'].includes(incomingEstadoDb)) {
      estadoInicial = incomingEstadoDb
    } else {
      estadoInicial = 'completada'
    }
    const setCompletedNow = estadoInicial === 'completada'

    // Normalizar evidencias: permitir string simple, CSV o array
    let evidenceList: string[] = []
    if (Array.isArray(evidenceUrls)) {
      evidenceList = evidenceUrls.filter((s: any) => typeof s === 'string').map((s: string) => s.trim()).filter(Boolean)
    } else if (typeof evidenceUrl === 'string') {
      evidenceList = evidenceUrl.split(',').map((s) => s.trim()).filter(Boolean)
    }

    // Subir data URLs o base64 "crudo"; aceptar solo http(s) como URL directa
    const uploadedOrUrls: string[] = []
    for (const item of evidenceList) {
      try {
        if (isDataUrl(item)) {
          const url = await uploadEvidenceDataUrl(item, title || 'evidencia')
          uploadedOrUrls.push(url)
        } else if (isLikelyBase64Payload(item)) {
          const url = await uploadEvidenceFromBase64Payload(item, title || 'evidencia')
          uploadedOrUrls.push(url)
        } else if (isHttpUrl(item)) {
          uploadedOrUrls.push(item)
        } else {
          console.warn('Evidencia ignorada por formato no reconocido')
        }
      } catch (e: any) {
        console.warn('Evidencia omitida por error de subida:', e?.message || e)
      }
    }
    // Limitar tamaño para evitar ER_DATA_TOO_LONG (asumimos VARCHAR(255) o similar)
    let evidenceCsv = uploadedOrUrls.length ? uploadedOrUrls.join(',') : null
    if (evidenceCsv && evidenceCsv.length > 255) {
      // Intentar recortar manteniendo URLs completas separadas por coma
      const acc: string[] = []
      let total = 0
      for (const u of uploadedOrUrls) {
        const add = (acc.length ? 1 : 0) + u.length // coma + url
        if (total + add > 255) break
        acc.push(u)
        total += add
      }
      evidenceCsv = acc.length ? acc.join(',') : null
      if (!evidenceCsv) console.warn('Todas las evidencias exceden el tamaño permitido, no se guardará evidencia_url')
    }

    const [result]: any = await db.query(
      `INSERT INTO tareas_mantenimiento (
         titulo, descripcion, auxiliar_id, creado_por, prioridad, estado,
         condominio_id, area_comun_id, fecha_vencimiento, evidencia_url,
         fecha_completada, fecha_creacion
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?, NOW())`,
      [
        title,
        description || null,
        assignedTo,
        assignedBy,
        prioridadDb,
        estadoInicial,
        condominiumId || null,
        sectionId || null,
        dueDate || null,
        evidenceCsv,
        setCompletedNow ? new Date() : null,
      ]
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
