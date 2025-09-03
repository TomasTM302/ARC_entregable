import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    await pool.query('SELECT 1')
    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('DB connection error:', err)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
