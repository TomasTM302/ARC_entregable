import { NextResponse } from "next/server"
import { google } from "googleapis"

export const runtime = "nodejs"
export const maxDuration = 30

function required(name: string, value?: string) {
  if (!value) throw new Error(`Falta variable de entorno: ${name}`)
  return value
}

function sanitizePrivateKey(raw?: string) {
  if (!raw) return raw
  let key = raw.trim()
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1)
  }
  key = key.replace(/\\r/g, "")
  key = key.replace(/\\n/g, "\n")
  return key
}

async function getDrive() {
  const clientEmail = required("GOOGLE_CLIENT_EMAIL", process.env.GOOGLE_CLIENT_EMAIL)
  const pkFromEnv = process.env.GOOGLE_PRIVATE_KEY
  const pkB64 = process.env.GOOGLE_PRIVATE_KEY_BASE64
  const privateKeyRaw = pkFromEnv || (pkB64 ? Buffer.from(pkB64, "base64").toString("utf8") : undefined)
  const privateKey = required("GOOGLE_PRIVATE_KEY[(_BASE64)]", sanitizePrivateKey(privateKeyRaw))

  const auth = new google.auth.JWT({ email: clientEmail, key: privateKey, scopes: ["https://www.googleapis.com/auth/drive"] })
  return google.drive({ version: "v3", auth })
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const name = url.searchParams.get("name")?.trim()
    const parentId = url.searchParams.get("parentId")?.trim() || "root"
    if (!name) return NextResponse.json({ ok: false, message: "Parámetro 'name' es requerido" }, { status: 400 })

    const drive = await getDrive()

    // Intentar encontrar una carpeta existente con ese nombre bajo parentId
    const q = `'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    const found = await drive.files.list({
      q,
      pageSize: 1,
      fields: "files(id,name)",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      spaces: "drive",
    })
    const existing = found.data.files?.[0]
    if (existing) {
      return NextResponse.json({ ok: true, created: false, id: existing.id, name: existing.name, parentId })
    }

    // Crear la carpeta
    const created = await drive.files.create({
      requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
      fields: "id, name",
      supportsAllDrives: true,
    })

    return NextResponse.json({ ok: true, created: true, id: created.data.id, name, parentId })
  } catch (err: any) {
    console.error("[drive/create-folder] Error:", err?.message || err)
    return NextResponse.json({ ok: false, message: err?.message || "Error al crear carpeta" }, { status: 500 })
  }
}
