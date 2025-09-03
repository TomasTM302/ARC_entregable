import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await pool.query('DELETE FROM usuario_propiedad WHERE usuario_id = ?', [params.id])
    await pool.query('DELETE FROM usuarios WHERE id = ?', [params.id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, message: 'Error del servidor' },
      { status: 500 }
    )
  }
}
