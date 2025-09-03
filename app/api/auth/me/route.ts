import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/jwt'
import { appRoleFromDbRole } from '@/lib/roles'

export async function GET(req: Request) {
  try {
    const cookie = (req as any).cookies?.get?.('arc_session')?.value ||
      (req.headers.get('cookie') || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('arc_session='))?.split('=')?.[1]
    if (!cookie) return NextResponse.json({ success: false, message: 'No session' }, { status: 401 })
    const { valid, payload } = verifyJWT(cookie)
    if (!valid || !payload?.sub) {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 })
    }
    const userId = payload.sub
    const [rows]: any = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.foto_url, u.rol_id, r.nombre AS rol_nombre, u.condominio_id, u.fecha_registro
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ? LIMIT 1`,
      [userId],
    )
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }
    const u = rows[0]
    const user = {
      id: String(u.id),
      firstName: u.nombre,
      lastName: u.apellido,
      email: u.email,
      phone: u.telefono ?? '',
      house: '',
      role: appRoleFromDbRole(u.rol_nombre ?? 'resident'),
      createdAt: u.fecha_registro,
      photoUrl: u.foto_url ?? '',
      condominiumId: u.condominio_id ?? null,
    }
    return NextResponse.json({ success: true, user })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Error' }, { status: 500 })
  }
}
