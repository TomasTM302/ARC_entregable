import { NextResponse } from "next/server"
import { verifyJWT, signJWT } from "@/lib/jwt"

export async function GET(req: Request) {
  try {
    const cookie = (req as any).cookies?.get?.("arc_session")?.value ||
      (req.headers.get("cookie") || "").split(";").map(s=>s.trim()).find(s=>s.startsWith("arc_session="))?.split("=")?.[1]
    if (!cookie) return NextResponse.json({ authenticated: false })
    const { valid, payload, reason } = verifyJWT(cookie)
    if (!valid) return NextResponse.json({ authenticated: false, reason })
    return NextResponse.json({ authenticated: true, session: payload })
  } catch (e: any) {
    return NextResponse.json({ authenticated: false, error: e?.message || "error" }, { status: 200 })
  }
}

export async function POST(req: Request) {
  // opcional: refresh sencillo si está por expirar (<2h)
  try {
    const cookie = (req as any).cookies?.get?.("arc_session")?.value ||
      (req.headers.get("cookie") || "").split(";").map(s=>s.trim()).find(s=>s.startsWith("arc_session="))?.split("=")?.[1]
    if (!cookie) return NextResponse.json({ refreshed: false })
    const { valid, payload } = verifyJWT(cookie)
    if (!valid) return NextResponse.json({ refreshed: false })
    const now = Math.floor(Date.now()/1000)
    const exp = Number(payload?.exp || 0)
    if (exp && exp - now < 60 * 60 * 2) {
      const newT = signJWT({ sub: payload.sub, role: payload.role }, { expiresInSec: 60 * 60 * 12 })
      const res = NextResponse.json({ refreshed: true })
      res.cookies.set('arc_session', newT, {
        httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
      })
      return res
    }
    return NextResponse.json({ refreshed: false })
  } catch (e: any) {
    return NextResponse.json({ refreshed: false })
  }
}
