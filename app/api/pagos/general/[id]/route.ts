import { NextResponse } from "next/server"
import pool from "@/lib/db"

// PATCH /api/pagos/general/[id]
// Body: { accion: 'aprobar'|'rechazar', notas?: string }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ success: false, message: "Falta id" }, { status: 400 })

  let conn: any
  try {
    const body = await req.json()
    const accion = body?.accion as string
    const notas = body?.notas as string | undefined
  console.log("[API][PAGOS][GENERAL][PATCH] id:", id, "accion:", accion, "notas:", notas)
    if (!accion || !["aprobar", "rechazar"].includes(accion)) {
      return NextResponse.json({ success: false, message: "Acción inválida" }, { status: 400 })
    }

    conn = await (pool as any).getConnection()
    await conn.beginTransaction()

    const now = new Date().toISOString().slice(0, 19).replace("T", " ")

  if (accion === "aprobar") {
      // Marcar pago general como completado (mismo enfoque simple que "rechazar")
      const [up]: any = await conn.query(
        `UPDATE pagos SET estado = 'completado', notas = CONCAT(IFNULL(notas,''), ?) WHERE id = ?`,
        [notas ? `\n[APROBADO ${now}] ${String(notas)}` : `\n[APROBADO ${now}]`, id]
      )
      if (!up || !up.affectedRows) throw new Error("Pago no encontrado")

  // Cascada: marcar como pagado y setear fecha_pago ahora
  console.log("[API][PAGOS][GENERAL][PATCH][APROBAR] cascade")
  // multas no tiene referencia_id → usar solo pago_id
  try { await conn.query(`UPDATE multas SET estado = 'pagada', fecha_pago = ? WHERE pago_id = ? AND estado <> 'cancelada'`, [now, id]) } catch {}
  // pagos_mantenimiento no tiene referencia_id → usar solo pago_id
  try { await conn.query(`UPDATE pagos_mantenimiento SET estado = 'pagado', fecha_pago = COALESCE(fecha_pago, ?) WHERE pago_id = ?`, [now, id]) } catch {}
  // pagos_convenio: usar pago_id del general
  try { await conn.query(`UPDATE pagos_convenio SET estado = 'pagado', fecha_pago = COALESCE(fecha_pago, ?) WHERE pago_id = ?`, [now, id]) } catch {}
    } else if (accion === "rechazar") {
      // Marcar pago general como rechazado y desvincular de entidades específicas (manteniéndolas pendientes)
      const [up]: any = await conn.query(
        `UPDATE pagos SET estado = 'rechazado', notas = CONCAT(IFNULL(notas,''), ?) WHERE id = ?`,
        [notas ? `\n[RECHAZADO ${now}] ${String(notas)}` : `\n[RECHAZADO ${now}]`, id]
      )
      if (!up || !up.affectedRows) {
        throw new Error("Pago no encontrado")
      }
      // Desvincular para permitir nueva conciliación futura
  // Volver a 'pendiente' solo las que están en 'procesando' y desvincular
  console.log("[API][PAGOS][GENERAL][PATCH][RECHAZAR] unlinking payment id:", id)
  await conn.query(`UPDATE multas SET estado = 'pendiente', pago_id = NULL WHERE pago_id = ? AND estado = 'procesando'`, [id])
  await conn.query(`UPDATE pagos_mantenimiento SET estado = 'pendiente', pago_id = NULL WHERE pago_id = ? AND estado = 'procesando'`, [id])
  await conn.query(`UPDATE pagos_convenio SET estado = 'pendiente', pago_id = NULL WHERE pago_id = ? AND estado = 'procesando'`, [id])
    }

    await conn.commit()
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (conn) await conn.rollback()
    return NextResponse.json({ success: false, message: err?.message || "Error al actualizar el pago" }, { status: 500 })
  } finally {
    if (conn) conn.release()
  }
}
