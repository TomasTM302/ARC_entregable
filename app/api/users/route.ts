import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { appRoleFromDbRole, dbRoleFromAppRole, type AppRole } from '@/lib/roles'

const ALL_ROLES_TOKEN = 'all'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roleParam = (searchParams.get('role') || ALL_ROLES_TOKEN).toLowerCase()

    const conditions: string[] = ['u.activo = TRUE']
    const params: any[] = []

    if (roleParam !== ALL_ROLES_TOKEN) {
      const normalizedRole = normalizeRoleParam(roleParam)
      if (normalizedRole) {
        if (normalizedRole === 'resident') {
          conditions.push('u.rol_id = 2')
        } else {
          conditions.push('LOWER(r.nombre) = LOWER(?)')
          params.push(dbRoleFromAppRole(normalizedRole))
        }
      }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows]: any = await pool.query(
      `SELECT
        u.id, u.nombre, u.apellido, u.email, u.telefono, u.fecha_registro,
        r.nombre AS rol_nombre,
        p.numero AS casa_numero,
        p.condominio_id
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN usuario_propiedad up ON u.id = up.usuario_id
      LEFT JOIN propiedades p ON up.propiedad_id = p.id
      ${whereClause}`,
      params,
    )

    const users = rows.map((u: any) => ({
      id: u.id.toString(),
      firstName: u.nombre,
      lastName: u.apellido,
      email: u.email,
      phone: u.telefono,
      house: u.casa_numero || '',
      condominiumId: u.condominio_id ? u.condominio_id.toString() : '',
      role: appRoleFromDbRole(u.rol_nombre),
      createdAt: u.fecha_registro,
    }))

    return NextResponse.json({ success: true, users })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, message: 'Error del servidor' },
      { status: 500 }
    )
  }
}

function normalizeRoleParam(role: string): AppRole | null {
  switch (role) {
    case 'admin':
    case 'administrator':
      return 'admin'
    case 'resident':
    case 'residente':
      return 'resident'
    case 'vigilante':
      return 'vigilante'
    case 'mantenimiento':
    case 'maintenance':
      return 'mantenimiento'
    default:
      return null
  }
}

export async function POST(request: Request) {
  const { firstName, lastName, email, phone, house, condominiumId, password, role } =
    await request.json()

  if (!firstName || !lastName || !email || !phone || !password || !role) {
    return NextResponse.json(
      { success: false, message: 'Faltan datos' },
      { status: 400 }
    )
  }

  try {
    const dbRole = dbRoleFromAppRole(role)
    let roleRows: any
    if (role === 'mantenimiento') {
      ;[roleRows] = await pool.query(
        'SELECT id FROM roles WHERE nombre = ? LIMIT 1',
        ['Mantenimiento']
      )
    } else {
      ;[roleRows] = await pool.query(
        'SELECT id FROM roles WHERE nombre = ? LIMIT 1',
        [dbRole]
      )
    }
    if (roleRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Rol inválido' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const [result]: any = await pool.query(
      'INSERT INTO usuarios (nombre, apellido, email, telefono, password_hash, rol_id, fecha_registro, activo) VALUES (?, ?, ?, ?, ?, ?, NOW(), TRUE)',
      [firstName, lastName, email, phone, passwordHash, roleRows[0].id]
    )
    const userId = result.insertId

    if (house && condominiumId) {
      // Buscar propiedad existente y disponible
      let propRows: any
      ;[propRows] = await pool.query(
        `SELECT p.id FROM propiedades p
         LEFT JOIN usuario_propiedad up ON p.id = up.propiedad_id
         WHERE p.numero = ? AND p.condominio_id = ? AND up.id IS NULL
         LIMIT 1`,
        [house, condominiumId]
      )
      if (!propRows.length) {
        return NextResponse.json(
          { success: false, message: 'No existe una propiedad disponible con ese número y condominio, o ya está asignada.' },
          { status: 400 }
        )
      }
      const propiedadId = propRows[0].id
      // Asignar propiedad a usuario con fecha_inicio actual
      await pool.query(
        'INSERT INTO usuario_propiedad (usuario_id, propiedad_id, fecha_inicio) VALUES (?, ?, NOW())',
        [userId, propiedadId]
      )
    }

    return NextResponse.json({ success: true, message: 'Usuario creado' })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, message: 'Error del servidor' },
      { status: 500 }
    )
  }
}
