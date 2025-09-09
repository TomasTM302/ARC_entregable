import { NextResponse } from 'next/server'
import db from '@/lib/db'

// PATCH: Marcar multa como pagada
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json({ success: false, message: 'Falta id' }, { status: 400 })
    }
    // Solo actualizar si actualmente está pendiente
    const [rows]: any = await db.query('SELECT estado FROM multas WHERE id = ? LIMIT 1', [id])
    if (!rows.length) {
      return NextResponse.json({ success: false, message: 'Multa no encontrada' }, { status: 404 })
    }
    if (rows[0].estado === 'pagada') {
      return NextResponse.json({ success: true, message: 'Ya estaba pagada' })
    }
    if (rows[0].estado === 'cancelada') {
      return NextResponse.json({ success: false, message: 'No se puede pagar una multa cancelada' }, { status: 400 })
    }
  // Registrar estado y fecha de pago
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await db.query('UPDATE multas SET estado = "pagada", fecha_pago = COALESCE(fecha_pago, ?) WHERE id = ?', [now, id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error al marcar como pagada:', err)
    return NextResponse.json({ success: false, message: 'Error al marcar como pagada', error: String(err) }, { status: 500 })
  }
}
