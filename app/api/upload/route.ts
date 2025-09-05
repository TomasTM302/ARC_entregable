import { NextResponse } from "next/server";
import { Readable } from "stream";
import { google } from "googleapis";

export const runtime = "nodejs";
export const maxDuration = 60;

const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

function required(name: string, value?: string) {
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

function sanitizePrivateKey(raw?: string) {
  if (!raw) return raw;
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\r/g, "");
  key = key.replace(/\\n/g, "\n");
  return key;
}

function getOAuthDriveClientStrict() {
  const clientId = required("GOOGLE_OAUTH_CLIENT_ID", process.env.GOOGLE_OAUTH_CLIENT_ID);
  const clientSecret = required("GOOGLE_OAUTH_CLIENT_SECRET", process.env.GOOGLE_OAUTH_CLIENT_SECRET);
  const refreshToken = required("GOOGLE_OAUTH_REFRESH_TOKEN", process.env.GOOGLE_OAUTH_REFRESH_TOKEN);
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth: oauth2 });
}

async function getDriveClient() {
  // OAuth2 obligatorio
  return getOAuthDriveClientStrict();
}

async function ensureFolderPath(
  drive: any,
  baseParentId: string,
  folderPath?: string
) {
  if (!folderPath) return baseParentId;
  const segments = folderPath
    .split(/[\\\/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  let parentId = baseParentId;
  for (const name of segments) {
    const q = `'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='${DRIVE_FOLDER_MIME}' and trashed=false`;
    const list = await drive.files.list({
      q,
      fields: "files(id,name)",
      pageSize: 1,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      spaces: "drive",
    });
    let id = list.data.files?.[0]?.id;
    if (!id) {
      const created = await drive.files.create({
        requestBody: { name, mimeType: DRIVE_FOLDER_MIME, parents: [parentId] },
        fields: "id",
        supportsAllDrives: true,
      });
      id = created.data.id!;
    }
    parentId = id;
  }
  return parentId;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const fileEntry = form.get("file");
    const folderEntry = form.get("folder");
    const folder = typeof folderEntry === "string" ? folderEntry : "";

    if (!fileEntry || typeof (fileEntry as any).arrayBuffer !== "function") {
      return NextResponse.json(
        { success: false, message: "No se ha proporcionado ningún archivo" },
        { status: 400 }
      );
    }

    const file = fileEntry as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0) {
      return NextResponse.json({ success: false, message: "Archivo vacío (size=0)" }, { status: 400 });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/\s+/g, "_");
    const fileName = `${timestamp}_${safeName}`;
    const mime = (file as any).type || "application/octet-stream";

    const drive = await getDriveClient();
    const baseParentId = required("GOOGLE_DRIVE_PARENT_FOLDER_ID", process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID);
    const parentId = await ensureFolderPath(drive, baseParentId, folder || undefined);

    const created = await drive.files.create({
      requestBody: { name: fileName, parents: [parentId] },
      media: { mimeType: mime, body: Readable.from(buffer) } as any,
      fields: "id, name, webViewLink, webContentLink, parents",
      supportsAllDrives: true,
    });

    const fileId = created.data.id!;
    const publicUrl = `https://drive.google.com/uc?id=${fileId}`;

    try {
      await drive.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" },
        supportsAllDrives: true,
      });
    } catch (permErr: any) {
      console.warn("No se pudo abrir por link (política dominio?):", permErr?.response?.data || permErr?.errors || permErr?.message);
    }

    return NextResponse.json({
      success: true,
      id: fileId,
      url: publicUrl,
      altLinks: {
        webViewLink: created.data.webViewLink,
        webContentLink: created.data.webContentLink,
      },
    });
  } catch (err: any) {
    const msg = String(err?.message || err || "");
    console.error("Drive upload failed:", { message: msg, errors: err?.errors, response: err?.response?.data, code: err?.code });
    const quotaHint = msg.includes("Service Accounts do not have storage quota")
      ? "La cuenta de servicio no tiene cuota propia. Usa una carpeta en Shared Drive o delegación OAuth (impersonación)."
      : undefined;
    return NextResponse.json(
      { success: false, message: quotaHint || err?.response?.data || msg || "Error al subir a Google Drive" },
      { status: 500 }
    );
  }
}