import { NextResponse } from "next/server"
import pool from "@/lib/db"

// PATCH solo para actualizar el campo activo de un área común
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { activo } = await req.json();
    if (!params.id || !activo) {
      return NextResponse.json({ success: false, message: "ID y estado 'activo' requeridos" }, { status: 400 });
    }
    // Validar valor permitido
    const activoEnum = activo === 'Inactivo' ? 'Inactivo' : 'Activo';
    await pool.execute(
      `UPDATE areas_comunes SET activo=? WHERE id=?`,
      [activoEnum, params.id]
    );
    return NextResponse.json({ success: true, message: "Estado actualizado correctamente" });
  } catch (err) {
    let msg = 'Error desconocido';
    if (err && typeof err === 'object' && 'message' in err) {
      msg = (err as any).message;
    } else if (typeof err === 'string') {
      msg = err;
    }
    return NextResponse.json({ success: false, message: `Error al actualizar estado: ${msg}` }, { status: 500 });
  }
}
