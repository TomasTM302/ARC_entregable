import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();
    const { estado } = body;
    if (!id || !estado) {
      return NextResponse.json({ success: false, message: "Faltan datos obligatorios" }, { status: 400 });
    }
    const [result]: any = await db.execute(
      "UPDATE reservaciones SET estado = ? WHERE id = ?",
      [estado, id]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "No se encontró la reservación" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Estado actualizado" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error al actualizar estado", error: (error as Error).message }, { status: 500 });
  }
}
