// utils para registrar logs en la tabla logs_sistema
import db from "@/lib/db"

export async function registrarLog({
  usuario_id,
  accion,
  tabla_afectada,
  registro_afectado,
  datos_anteriores,
  datos_nuevos,
  ip
}: {
  usuario_id?: number
  accion: string
  tabla_afectada: string
  registro_afectado?: number
  datos_anteriores?: any
  datos_nuevos?: any
  ip?: string
}) {
  try {
    await db.query(
      `INSERT INTO logs_sistema (usuario_id, accion, tabla_afectada, registro_afectado, datos_anteriores, datos_nuevos, ip) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id || null,
        accion,
        tabla_afectada,
        registro_afectado || null,
        datos_anteriores ? JSON.stringify(datos_anteriores) : null,
        datos_nuevos ? JSON.stringify(datos_nuevos) : null,
        ip || null
      ]
    )
    return true
  } catch (err) {
    console.error("Error al registrar log:", err)
    return false
  }
}
