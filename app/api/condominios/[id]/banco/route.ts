import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req, { params }) {
  const condominioId = params.id;
  if (!condominioId) {
    return NextResponse.json({ success: false, message: "Falta el ID del condominio" }, { status: 400 });
  }
  try {
    const [rows] = await pool.execute(`
      SELECT nombre_banco, nombre_titular, clave_inter
      FROM condominios
      WHERE id = ?
      LIMIT 1
    `, [condominioId]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Condominio no encontrado" }, { status: 404 });
    }
    const banco = rows[0];
    return NextResponse.json({ success: true, banco });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al obtener datos bancarios" }, { status: 500 });
  }
}
