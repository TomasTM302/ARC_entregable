import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request, context: { params: any }) {
  const { id: condominioId } = await context.params;
  if (!condominioId) {
    return NextResponse.json({ success: false, message: "Falta el ID del condominio" }, { status: 400 });
  }
  try {
    const [rows] = await pool.execute(`
      SELECT id, nombre, nombre AS name, LEFT(direccion,256) AS direccion, ciudad, estado, codigo_postal, telefono, email, logo_url, fecha_creacion, activo
      FROM condominios
      WHERE id = ?
      LIMIT 1
    `, [condominioId]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Condominio no encontrado" }, { status: 404 });
    }
    const condominio = rows[0];
    return NextResponse.json({ success: true, condominio });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al obtener condominio", error: err?.message || String(err) }, { status: 500 });
  }
}
