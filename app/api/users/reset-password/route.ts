import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST /api/users/reset-password
// Body: { email: string, password: string }
// Seguridad: permitido en desarrollo; en producción requiere ADMIN_RESET_TOKEN
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'email y password son requeridos' }, { status: 400 })
    }

    const allow = process.env.NODE_ENV !== 'production' || !!process.env.ADMIN_RESET_TOKEN
    if (!allow) return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 403 })

    if (process.env.NODE_ENV === 'production') {
      const auth = req.headers.get('authorization') || ''
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
      if (!token || token !== process.env.ADMIN_RESET_TOKEN) {
        return NextResponse.json({ success: false, message: 'Token inválido' }, { status: 403 })
      }
    }

    const emailNorm = String(email).trim().toLowerCase()
    const hash = await bcrypt.hash(String(password), 10)

    const [res]: any = await pool.query(`UPDATE usuarios SET password_hash = ?, activo = TRUE WHERE LOWER(email) = ?`, [hash, emailNorm])
    if (!res?.affectedRows) {
      return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Error del servidor' }, { status: 500 })
  }
}
