import { NextResponse } from "next/server";

// Genera una referencia única para pagos
export async function POST(req: Request) {
  try {
    const { base } = await req.json(); // base puede ser un string base para la referencia
    // Genera referencia: base + fecha + random
    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    const hh = String(fecha.getHours()).padStart(2, "0");
    const min = String(fecha.getMinutes()).padStart(2, "0");
    const ss = String(fecha.getSeconds()).padStart(2, "0");
    let referencia = `${base || "REF"}${yyyy}${mm}${dd}${hh}${min}${ss}`;
    // Insertar número aleatorio del 1 al 9 en el carácter 10
    const random = Math.floor(Math.random() * 9) + 1;
    referencia = referencia.slice(0, 9) + random + referencia.slice(10);
    return NextResponse.json({ success: true, referencia });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Error al generar referencia" }, { status: 500 });
  }
}
