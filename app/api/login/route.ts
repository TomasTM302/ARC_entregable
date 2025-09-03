import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
import { appRoleFromDbRole } from '@/lib/roles'
import { signJWT } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Faltan credenciales' }, { status: 400 })
    }

    const emailNorm = String(email).trim().toLowerCase()

    // Retry simple para errores de conexiones saturadas
    const attempt = async () => {
      const [rows] = (await pool.query(
        `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.foto_url, u.password_hash, u.rol_id, r.nombre AS rol_nombre, u.condominio_id, u.fecha_registro
         FROM usuarios u
         LEFT JOIN roles r ON u.rol_id = r.id
         WHERE LOWER(u.email) = ? LIMIT 1`,
        [emailNorm],
      )) as any
      return rows as any[]
    }

    let rows: any[] = []
    try {
      rows = await attempt()
    } catch (e: any) {
      if (e?.code === 'ER_CON_COUNT_ERROR') {
        await new Promise((r) => setTimeout(r, 200))
        rows = await attempt()
      } else {
        throw e
      }
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Credenciales incorrectas' }, { status: 401 })
    }
    const user = rows[0]
    const match = await bcrypt.compare(String(password), user.password_hash)
    if (!match) {
      return NextResponse.json({ success: false, message: 'Credenciales incorrectas' }, { status: 401 })
    }

    // Actualizar último acceso (si existe la columna, ignorar error si no existe)
    pool
      .query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [user.id])
      .catch(() => {})

    const result = {
      id: String(user.id),
      firstName: user.nombre,
      lastName: user.apellido,
      email: user.email,
      phone: user.telefono ?? '',
      house: '',
      role: appRoleFromDbRole(user.rol_nombre ?? 'resident'),
      createdAt: user.fecha_registro,
      photoUrl: user.foto_url ?? '',
      condominiumId: user.condominio_id ?? null,
    }
    // Emitir JWT de sesión (12h por defecto)
    const token = signJWT({ sub: result.id, role: result.role }, { expiresInSec: 60 * 60 * 12 })
    const res = NextResponse.json({ success: true, user: result, token })
    const maxAge = 60 * 60 * 24 * 7 // 7 días
    res.cookies.set('arc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/',
      maxAge,
    })
    return res
  } catch (err) {
    console.error('Login API error:', err)
    return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 })
  }
}
