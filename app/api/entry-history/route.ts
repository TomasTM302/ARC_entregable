import { NextResponse } from 'next/server'
import pool from '@/lib/db'

const table = 'historial_entradas'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    let sql =
      `SELECT id, ine, tipo, vigilante_id, condominio_id, fecha_entrada, fecha_salida, placa_vehiculo, scanned_at FROM ${table}`
    const params: any[] = []

    if (date) {
      const start = new Date(date)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      sql += ' WHERE scanned_at >= ? AND scanned_at < ?'
      params.push(start, end)
    }

    sql += ' ORDER BY scanned_at DESC LIMIT 100'

    const [rows] = (await pool.execute(sql, params)) as any[]
    return NextResponse.json({ success: true, data: rows })
  } catch (err: any) {
    console.error('GET /api/entry-history error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const allowed = [
      'ine',
      'tipo',
      'vigilante_id',
      'condominio_id',
      'fecha_entrada',
      'fecha_salida',
      'placa_vehiculo',
      'scanned_at',
    ] as const

    const cols: string[] = []
    const values: any[] = []

    for (const key of allowed) {
      if (body[key] !== undefined) {
        cols.push(key)
        if (key.includes('fecha')) {
          values.push(new Date(body[key]))
        } else {
          values.push(body[key])
        }
      }
    }

    if (cols.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No data provided' },
        { status: 400 },
      )
    }

    const placeholders = cols.map(() => '?').join(', ')
    await pool.execute(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
      values,
    )
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('POST /api/entry-history error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    await pool.execute(`DELETE FROM ${table}`)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/entry-history error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 },
    )
  }
}
