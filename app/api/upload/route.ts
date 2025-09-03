// app/api/upload/route.ts

import { NextResponse } from "next/server";
import { Readable } from "stream";
import { google } from "googleapis";

export const runtime = "nodejs";

const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

function required(name: string, value?: string) {
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

async function getDriveClient() {
  const clientEmail = required("GOOGLE_CLIENT_EMAIL", process.env.GOOGLE_CLIENT_EMAIL);
  // Importante: las llaves suelen venir con \n escapados en env; los restauramos.
  let privateKey = required("GOOGLE_PRIVATE_KEY", process.env.GOOGLE_PRIVATE_KEY);
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

async function ensureFolderPath(drive: ReturnType<typeof google.drive>, baseParentId: string, folderPath?: string) {
  if (!folderPath) return baseParentId;
  const segments = folderPath
    .split(/[\\/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  let parentId = baseParentId;
  for (const name of segments) {
    const list = await drive.files.list({
      q: `'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='${DRIVE_FOLDER_MIME}' and trashed=false`,
      fields: "files(id,name)",
      pageSize: 1,
      spaces: "drive",
    });
    let id = list.data.files?.[0]?.id;
    if (!id) {
      const created = await drive.files.create({
        requestBody: {
          name,
          mimeType: DRIVE_FOLDER_MIME,
          parents: [parentId],
        },
        fields: "id",
      });
      id = created.data.id!;
    }
    parentId = id;
  }
  return parentId;
}

export async function POST(req: Request) {
  try {
    // 1) Extraer el archivo y la carpeta (opcional) del FormData
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string) || ""; // p.ej. "FotosARC/2025-09"

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No se ha proporcionado ningún archivo" },
        { status: 400 }
      );
    }

    // 2) Convertir a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3) Generar un nombre único para el fichero
    const timestamp = Date.now();
    const safeName = file.name.replace(/\s+/g, "_");
    const fileName = `${timestamp}_${safeName}`;

    // 4) Autenticarse en Google Drive
    const drive = await getDriveClient();
    const baseParentId = required(
      "GOOGLE_DRIVE_PARENT_FOLDER_ID",
      process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
    );

    // 5) Asegurar subcarpetas si se indicó `folder`
    const parentId = await ensureFolderPath(drive, baseParentId, folder || undefined);

    // 6) Subir archivo
    const media = { mimeType: (file as any).type || undefined, body: Readable.from(buffer) } as any;
    const created = await drive.files.create({
      requestBody: { name: fileName, parents: [parentId] },
      media,
      fields: "id, webViewLink, webContentLink",
    });
    const fileId = created.data.id!;

    // 7) Hacerlo público (lectura)
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    // 8) Construir URL pública directa (descarga/uso en img)
    const publicUrl = `https://drive.google.com/uc?id=${fileId}`;

    return NextResponse.json({ success: true, url: publicUrl, id: fileId });
  } catch (err: any) {
    console.error("Drive upload failed:", err?.message || err);
    return NextResponse.json(
      { success: false, message: err?.message || "Error al subir a Google Drive" },
      { status: 500 }
    );
  }
}
