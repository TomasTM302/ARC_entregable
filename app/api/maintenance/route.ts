import { NextResponse } from "next/server"
import pool from "@/lib/db"

// GET: devuelve configuración de mantenimiento usando cuotas_mantenimiento + datos bancarios de condominios
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
  const condoIdQ = searchParams.get("condominioId")
    // Tomamos la última cuota vigente (opcionalmente filtrada por condominio)
  const where = condoIdQ ? `WHERE condominio_id = ?` : ""
    const [rows]: any = await pool.query(
      `SELECT id, condominio_id, monto, fecha_inicio, fecha_fin, recargo_porcentaje, dias_gracia
       FROM cuotas_mantenimiento
       ${where}
       ORDER BY fecha_inicio DESC, id DESC
       LIMIT 1`,
  condoIdQ ? [condoIdQ] : []
    )
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, settings: null, history: [] })
    }
    const c = rows[0]
  const condoIdRow = c.condominio_id

    // Datos bancarios del condominio
    let bank: any = null
    try {
      const [brows]: any = await pool.query(
        `SELECT nombre_banco AS bank_name, nombre_titular AS account_holder, clave_inter AS clabe
         FROM condominios WHERE id = ? LIMIT 1`,
  [condoIdRow]
      )
      bank = brows && brows[0] ? brows[0] : null
    } catch (_) {
      bank = null
    }

    // Calcular late_fee: si recargo_porcentaje > 1 asumimos monto directo; si 0<..<=1, porcentaje del monto
    let late_fee: number | null = null
    if (c.recargo_porcentaje != null) {
      const rp = Number(c.recargo_porcentaje)
      late_fee = rp > 1 ? rp : Number((rp * Number(c.monto)).toFixed(2))
    }

    const settings = {
      id: c.id,
      price: Number(c.monto),
      // Usamos dias_gracia como due_day para el frontend
      due_day: c.dias_gracia != null ? Number(c.dias_gracia) : undefined,
      late_fee: late_fee ?? undefined,
      bank_name: bank?.bank_name ?? undefined,
      account_holder: bank?.account_holder ?? undefined,
      clabe: bank?.clabe ?? undefined,
      updated_at: undefined,
      updated_by: undefined,
    }

    // No hay historial en BD actual; devolvemos vacío
    return NextResponse.json({ success: true, settings, history: [] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}

// PUT: actualiza monto/recargo en cuotas_mantenimiento y datos bancarios en condominios
export async function PUT(req: Request) {
  try {
  const body = await req.json()
  const { price, dueDay, lateFee, bankName, accountHolder, clabe, condominioId: condoIdBody } = body || {}

    if (
      price === undefined &&
      dueDay === undefined &&
      lateFee === undefined &&
      bankName === undefined &&
      accountHolder === undefined &&
      clabe === undefined
    ) {
      return NextResponse.json({ success: false, message: "No data provided" }, { status: 400 })
    }

    // Ubicar la fila vigente de cuotas y el condominio (por condominioId si se especifica)
  const where = condoIdBody ? `WHERE condominio_id = ?` : ""
    const [rows]: any = await pool.query(
      `SELECT id, condominio_id, monto, recargo_porcentaje, dias_gracia
       FROM cuotas_mantenimiento
       ${where}
       ORDER BY fecha_inicio DESC, id DESC
       LIMIT 1`,
  condoIdBody ? [condoIdBody] : []
    )
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: "No hay cuotas_mantenimiento para actualizar" }, { status: 400 })
    }
  const cm = rows[0]
  const condoIdRow2 = cm.condominio_id

    // Construir UPDATE dinámico para cuotas_mantenimiento
    const setParts: string[] = []
    const values: any[] = []
    if (price !== undefined) { setParts.push("monto = ?"); values.push(price) }
    // dueDay no mapea 1:1; evitamos tocar dias_gracia si no se define explícitamente una política
  if (lateFee !== undefined) { setParts.push("recargo_porcentaje = ?"); values.push(lateFee) }
  if (dueDay !== undefined) { setParts.push("dias_gracia = ?"); values.push(dueDay) }
    // si nada que actualizar en cuotas
    if (setParts.length > 0) {
      await pool.query(`UPDATE cuotas_mantenimiento SET ${setParts.join(", ")} WHERE id = ?`, [...values, cm.id])
    }

    // Actualizar datos bancarios si se proveen
    if (bankName !== undefined || accountHolder !== undefined || clabe !== undefined) {
      await pool.query(
        `UPDATE condominios
         SET nombre_banco = COALESCE(?, nombre_banco),
             nombre_titular = COALESCE(?, nombre_titular),
             clave_inter = COALESCE(?, clave_inter)
         WHERE id = ?`,
  [bankName ?? null, accountHolder ?? null, clabe ?? null, condoIdRow2]
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
