import crypto from "crypto"

// Base64 URL helpers
const b64url = {
  encode: (buf: Buffer) => buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"),
  decode: (str: string) => Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (str.length % 4)) % 4), "base64"),
}

export function signJWT(payload: object, opts?: { expiresInSec?: number }) {
  const header = { alg: "HS256", typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const exp = opts?.expiresInSec ? now + opts.expiresInSec : undefined
  const body = exp ? { ...payload, iat: now, exp } : { ...payload, iat: now }
  const secret = process.env.JWT_SECRET || "dev-secret"

  const headerB64 = b64url.encode(Buffer.from(JSON.stringify(header)))
  const payloadB64 = b64url.encode(Buffer.from(JSON.stringify(body)))
  const data = `${headerB64}.${payloadB64}`
  const sig = crypto.createHmac("sha256", secret).update(data).digest()
  const sigB64 = b64url.encode(sig)
  return `${data}.${sigB64}`
}

export function verifyJWT(token: string): { valid: boolean; payload?: any; reason?: string } {
  try {
    const [h, p, s] = token.split(".")
    if (!h || !p || !s) return { valid: false, reason: "format" }
    const secret = process.env.JWT_SECRET || "dev-secret"
    const data = `${h}.${p}`
    const sig = crypto.createHmac("sha256", secret).update(data).digest()
    const sigB64 = b64url.encode(sig)
    if (sigB64 !== s) return { valid: false, reason: "signature" }
    const payload = JSON.parse(b64url.decode(p).toString("utf8"))
    if (payload?.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return { valid: false, reason: "expired" }
    }
    return { valid: true, payload }
  } catch (e: any) {
    return { valid: false, reason: e?.message || "error" }
  }
}
