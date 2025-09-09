import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Proxy simple para obtener imágenes desde Drive (o cualquier URL) y evitar problemas de CORS en el browser
// Uso: /api/drive/fetch?src=<URL>
// Si se pasa ?id=<FILE_ID>, se construye el thumbnail de Drive con tamaño grande.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id") || undefined
    const src = searchParams.get("src") || undefined
    let target: string | undefined

    if (id) {
      // Preferir thumbnail grande; Drive permite parámetro sz.
      target = `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w2000`
    } else if (src) {
      // Aceptar cualquier URL, pero si es Drive uc?id o /file/d, intentar mover a thumbnail
      try {
        const raw = decodeURIComponent(src)
        const mUc = raw.match(/[?&]id=([\w-]+)/)
        const mFile = raw.match(/drive\.google\.com\/file\/d\/([\w-]+)/)
        if (mUc?.[1]) target = `https://drive.google.com/thumbnail?id=${mUc[1]}&sz=w2000`
        else if (mFile?.[1]) target = `https://drive.google.com/thumbnail?id=${mFile[1]}&sz=w2000`
        else target = raw
      } catch {
        target = src
      }
    }

    if (!target) return NextResponse.json({ success: false, message: "Falta parámetro src o id" }, { status: 400 })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    const res = await fetch(target, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) {
      return NextResponse.json({ success: false, message: `Error remoto ${res.status}` }, { status: 502 })
    }

    const contentType = res.headers.get("content-type") || "image/jpeg"
    const buf = Buffer.from(await res.arrayBuffer())
    return new Response(buf, {
      status: 200,
      headers: {
        "content-type": contentType,
        // Permitir cachear por 10 minutos
        "cache-control": "public, max-age=600",
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: "Error en proxy de imagen", error: String(e?.message || e) }, { status: 500 })
  }
}
