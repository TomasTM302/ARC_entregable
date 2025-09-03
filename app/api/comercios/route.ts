import { NextResponse } from "next/server"
import pool from "@/lib/db"

// GET: listar comercios
export async function GET() {
  try {
    const [rows] = await pool.execute(`SELECT * FROM comercios`)
    const comercios = Array.isArray(rows)
      ? (rows as any[]).map((row) => ({
          // Normalizado para frontend
          id: row.id,
          name: row.nombre,
          description: row.descripcion ?? null,
          address: row.direccion ?? null,
          phone: row.telefono ?? null,
          email: row.email ?? null,
          websiteUrl: row.sitio_web ?? null,
          imageUrl: row.logo_url ?? null,
          category: row.categoria ?? null,
          discount: row.descuento ?? null,
          createdAt: row.fecha_registro,
          isActive: row.activo === 1 || row.activo === "1" || row.activo === true,
          condominiumId: row.condominio_id ?? null,

          // Nombres originales
          nombre: row.nombre,
          descripcion: row.descripcion,
          direccion: row.direccion,
          telefono: row.telefono,
          sitio_web: row.sitio_web,
          logo_url: row.logo_url,
          categoria: row.categoria,
          descuento: row.descuento,
          fecha_registro: row.fecha_registro,
          activo: row.activo,
          condominio_id: row.condominio_id,
        }))
      : []
    return NextResponse.json({ success: true, comercios })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al obtener comercios" }, { status: 500 })
  }
}

// POST: crear comercio
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      nombre,
      categoria,
      sitio_web,
      logo_url,
      descripcion,
      direccion,
      telefono,
      email,
      descuento,
      condominio_id,
      activo = 1,
    } = body

    if (!nombre || !categoria) {
      return NextResponse.json({ success: false, message: "Nombre y categoría son obligatorios" }, { status: 400 })
    }

    const [result]: any = await pool.execute(
      `INSERT INTO comercios (condominio_id, nombre, descripcion, direccion, telefono, email, sitio_web, logo_url, categoria, descuento, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [condominio_id ?? null, nombre, descripcion ?? null, direccion ?? null, telefono ?? null, email ?? null, sitio_web ?? null, logo_url ?? null, categoria ?? null, descuento ?? null, activo ? 1 : 0]
    )

    const [rows] = await pool.execute(`SELECT * FROM comercios WHERE id = ?`, [result.insertId])
    const row: any = Array.isArray(rows) ? (rows as any[])[0] : null
    if (!row) return NextResponse.json({ success: false, message: "No se pudo recuperar el comercio creado" }, { status: 500 })

    const comercio = {
      id: row.id,
      name: row.nombre,
      websiteUrl: row.sitio_web,
      imageUrl: row.logo_url,
      category: row.categoria,
      createdAt: row.fecha_registro,
      // originales
      nombre: row.nombre,
      sitio_web: row.sitio_web,
      logo_url: row.logo_url,
      categoria: row.categoria,
      fecha_registro: row.fecha_registro,
    }
    return NextResponse.json({ success: true, comercio })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al crear comercio" }, { status: 500 })
  }
}
