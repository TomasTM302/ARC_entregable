import mysql from 'mysql2/promise'

// Singleton del pool para evitar "Too many connections" en dev y rutas Lambda
// Permite configurar el límite vía env DB_POOL_LIMIT
const connectionLimit = Number(process.env.DB_POOL_LIMIT ?? 25)

const createPool = () =>
  mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT ?? 3306),
    waitForConnections: true,
    connectionLimit,
    // queueLimit 0 = ilimitado; dejar en 0 para aplicar backpressure del pool
    queueLimit: 0,
  })

// Usar caché global en desarrollo y Next.js hot-reload
const globalAny = global as any
const pool = globalAny.__ARC_DB_POOL__ ?? createPool()
if (!globalAny.__ARC_DB_POOL__) {
  globalAny.__ARC_DB_POOL__ = pool
}

export default pool
