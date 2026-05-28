import { NextResponse } from 'next/server'

// Este endpoint lo llama Vercel Cron automáticamente
// Configurado en vercel.json para correr cada minuto durante el Mundial
export async function GET(request: Request) {
  // Verificar que viene de Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Llamar al endpoint de live scores
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lacocinaushuaia.com.ar'
  const res = await fetch(`${baseUrl}/api/live-scores`)
  const data = await res.json()

  return NextResponse.json({ ok: true, sync: data, timestamp: new Date().toISOString() })
}