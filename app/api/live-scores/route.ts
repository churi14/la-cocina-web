import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET() {
  try {
    // 1. Traer partidos en juego o abiertos de Supabase
    const { data: partidos } = await supabase
      .from('partidos')
      .select('*')
      .in('estado', ['abierto', 'en_juego'])

    if (!partidos || partidos.length === 0) {
      return NextResponse.json({ ok: true, msg: 'No hay partidos activos', actualizados: 0 })
    }

    // 2. Llamar a API-Football — fixtures en vivo del Mundial 2026
    // League ID 1 = FIFA World Cup
    const res = await fetch(
      'https://v3.football.api-sports.io/fixtures?league=1&season=2026&live=all',
      {
        headers: {
          'x-apisports-key': process.env.RAPIDAPI_KEY!,
        },
        next: { revalidate: 0 },
      }
    )

    const json = await res.json()
    const fixtures = json.response || []

    // 3. Si no hay partidos en vivo, traer los de hoy para ver si terminaron
    let fixturesHoy = fixtures
    if (fixtures.length === 0) {
      const hoy = new Date().toISOString().split('T')[0]
      const resHoy = await fetch(
        `https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${hoy}`,
        {
          headers: {
            'x-apisports-key': process.env.RAPIDAPI_KEY!,
          },
          next: { revalidate: 0 },
        }
      )
      const jsonHoy = await resHoy.json()
      fixturesHoy = jsonHoy.response || []
    }

    let actualizados = 0

    // 4. Cruzar fixtures con nuestros partidos por nombre de equipo
    for (const fixture of fixturesHoy) {
      const homeTeam = fixture.teams.home.name
      const awayTeam = fixture.teams.away.name
      const golesLocal = fixture.goals.home
      const golesVisitante = fixture.goals.away
      const minuto = fixture.fixture.status.elapsed
      const statusShort = fixture.fixture.status.short
      // FT = Full Time, 1H/2H = en juego, NS = no empezó
      const enVivo = ['1H', '2H', 'HT', 'ET', 'P'].includes(statusShort)
      const finalizado = statusShort === 'FT'

      // Buscar partido en nuestra base por nombre similar
      const partido = partidos.find(p => {
        const localMatch = p.equipo_local.toLowerCase().includes(homeTeam.toLowerCase()) ||
          homeTeam.toLowerCase().includes(p.equipo_local.replace(/[^\w\s]/g, '').toLowerCase().trim())
        const visitanteMatch = p.equipo_visitante.toLowerCase().includes(awayTeam.toLowerCase()) ||
          awayTeam.toLowerCase().includes(p.equipo_visitante.replace(/[^\w\s]/g, '').toLowerCase().trim())
        return localMatch && visitanteMatch
      })

      if (!partido) continue

      // 5. Actualizar en Supabase
      const update: Record<string, unknown> = {
        goles_local: golesLocal,
        goles_visitante: golesVisitante,
        en_vivo: enVivo,
        minuto: minuto || null,
      }

      if (finalizado) {
        update.estado = 'finalizado'
        update.en_vivo = false

        // 6. Calcular puntos automáticamente si terminó
        const { data: pronos } = await supabase
          .from('pronosticos')
          .select('*')
          .eq('partido_id', partido.id)

        if (pronos && pronos.length > 0) {
          const inserts = pronos.map(pr => {
            let puntos = 0
            let detalle = 'error'

            if (pr.goles_local === golesLocal && pr.goles_visitante === golesVisitante) {
              puntos = 3
              detalle = 'exacto'
            } else {
              const tendenciaReal = golesLocal > golesVisitante ? 'L' : golesLocal < golesVisitante ? 'V' : 'E'
              const tendenciaPron = pr.goles_local > pr.goles_visitante ? 'L' : pr.goles_local < pr.goles_visitante ? 'V' : 'E'
              if (tendenciaReal === tendenciaPron) {
                puntos = 1
                detalle = 'tendencia'
              }
            }
            return { usuario_id: pr.usuario_id, partido_id: partido.id, puntos, detalle }
          })

          await supabase
            .from('puntos')
            .upsert(inserts, { onConflict: 'usuario_id,partido_id' })
        }
      } else if (enVivo) {
        update.estado = 'en_juego'
      }

      await supabase
        .from('partidos')
        .update(update)
        .eq('id', partido.id)

      actualizados++
    }

    return NextResponse.json({ ok: true, actualizados, fixtures: fixturesHoy.length })

  } catch (error) {
    console.error('Error sync live scores:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}