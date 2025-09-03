import { NextResponse } from "next/server"
import pool from "@/lib/db"

/**
 * GET /api/condominios
 * Parámetros opcionales:
 *  - activo=1   -> solo activos
 *  - simple=1   -> solo id y nombre
 *  - debug=1    -> agrega meta debug (no usar en prod)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const onlyActive = searchParams.get("activo") === "1"
  const simple = searchParams.get("simple") === "1"
  const debug = searchParams.get("debug") === "1"

  const baseWhere: string[] = []
  if (onlyActive) baseWhere.push("activo = 1")
  const whereClause = baseWhere.length ? `WHERE ${baseWhere.join(" AND ")}` : ""

  // Consultas
  const fullQuery = `SELECT id, nombre, nombre AS name, LEFT(direccion,256) AS direccion, ciudad, estado, codigo_postal, telefono, email, logo_url, fecha_creacion, activo FROM condominios ${whereClause} ORDER BY nombre`;
  const simpleQuery = `SELECT id, nombre, nombre AS name FROM condominios ${whereClause} ORDER BY nombre`;

  let diagnostics: any = {}
  try {
    let rows: any[] = []
    if (simple) {
      const [r] = await pool.execute(simpleQuery)
      rows = r as any[]
    } else {
      try {
        const [r] = await pool.execute(fullQuery)
        rows = r as any[]
      } catch (innerErr: any) {
        // Fallback a consulta simple si alguna columna no existe
        console.error("[condominios] Error consulta completa, intentando fallback simple:", innerErr?.message || innerErr)
        diagnostics.fullQueryError = innerErr?.message || String(innerErr)
        const [r2] = await pool.execute(simpleQuery)
        rows = r2 as any[]
      }
    }

    const payload: any = { success: true, condominiums: rows }
    if (debug) {
      payload.debug = {
        whereClause,
        simple,
        attemptedFull: !simple,
        diagnostics,
        count: rows.length,
      }
    }
    return NextResponse.json(payload)
  } catch (err: any) {
    console.error("[condominios] Error general:", err?.message || err)
    return NextResponse.json(
      { success: false, message: "Error al obtener condominios", error: debug ? (err?.message || String(err)) : undefined },
      { status: 500 }
    )
  }
}
