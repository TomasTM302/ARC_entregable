// app/api/drive/health/route.ts

import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";
export const maxDuration = 30;

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
  const drive = getOAuthDriveClientStrict();
  return { drive, clientEmail: "oauth", subject: null as any };
}

export async function GET() {
  try {
  const parentId = required("GOOGLE_DRIVE_PARENT_FOLDER_ID", process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID);
  const hasOAuthId = Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID);
  const hasOAuthSecret = Boolean(process.env.GOOGLE_OAUTH_CLIENT_SECRET);
  const hasOAuthRefresh = Boolean(process.env.GOOGLE_OAUTH_REFRESH_TOKEN);
  const { drive, clientEmail, subject } = await getDriveClient();

    // 1) Comprobar que la carpeta existe
    const folderMeta = await drive.files.get({
      fileId: parentId,
      fields: "id, name, driveId, parents, mimeType",
      supportsAllDrives: true,
    });

    // 2) Intentar listar algunos elementos de la carpeta
    const list = await drive.files.list({
      q: `'${parentId}' in parents and trashed=false`,
      fields: "files(id,name,mimeType)",
      pageSize: 5,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      spaces: "drive",
    });

    // 3) Probar escritura/permiso de creación
    let writeTest: any = { ok: false };
    try {
      const name = `healthcheck-${Date.now()}.txt`;
      const content = Buffer.from("drive health ok", "utf8");
      const created = await drive.files.create({
        requestBody: { name, parents: [parentId] },
        media: { mimeType: "text/plain", body: content } as any,
        fields: "id, name",
        supportsAllDrives: true,
      });
      const tempId = created.data.id!;
      // intentar borrar para no dejar basura
      await drive.files.delete({ fileId: tempId, supportsAllDrives: true });
      writeTest = { ok: true, createdThenDeleted: true, fileName: name };
    } catch (e: any) {
      writeTest = { ok: false, error: e?.errors || e?.message || String(e) };
    }

    return NextResponse.json({
      ok: true,
      clientEmail,
      env: {
        hasOAuthId,
        hasOAuthSecret,
        hasOAuthRefresh,
        hasParentFolderId: Boolean(parentId),
  impersonateSubject: subject || null,
      },
      parentFolder: {
        id: folderMeta.data.id,
        name: folderMeta.data.name,
        mimeType: folderMeta.data.mimeType,
        driveId: (folderMeta.data as any).driveId || null,
      },
  sampleItems: (list.data.files || []).map((f: any) => ({ id: f.id, name: f.name, mimeType: f.mimeType })),
      writeTest,
      message: "Conexión a Drive exitosa; listado y prueba de escritura ejecutadas",
    });
  } catch (err: any) {
    console.error("[drive/health] Error:", err?.message || err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Error en verificación de Drive" },
      { status: 500 }
    );
  }
}
