import { NextResponse } from "next/server"

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('arc_session', '', { httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}
