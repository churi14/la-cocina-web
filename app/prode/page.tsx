'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import ProdeAuth from './ProdeAuth'

type Screen = 'home' | 'jugar' | 'ranking'
type TabPartidos = 'pendientes' | 'completados'

interface Usuario { id: string; nombre: string; apellido: string; telefono: string }
interface Partido {
  id: string; equipo_local: string; equipo_visitante: string
  fecha_hora: string; goles_local: number | null; goles_visitante: number | null
  minuto: number | null; en_vivo: boolean; estado: string; grupo: string; fase: string
}
interface Pronostico { partido_id: string; goles_local: number; goles_visitante: number }
interface RankingItem { id: string; nombre: string; apellido: string; total: number; exactos: number; tendencias: number }

// Mapa de países a código de bandera
const FLAG_MAP: Record<string, string> = {
  'argentina': 'ar', 'chile': 'cl', 'perú': 'pe', 'peru': 'pe', 'brasil': 'br', 'brazil': 'br',
  'uruguay': 'uy', 'colombia': 'co', 'venezuela': 've', 'ecuador': 'ec', 'bolivia': 'bo',
  'paraguay': 'py', 'mexico': 'mx', 'méxico': 'mx', 'estados unidos': 'us', 'usa': 'us',
  'canadá': 'ca', 'canada': 'ca', 'panamá': 'pa', 'panama': 'pa', 'jamaica': 'jm',
  'francia': 'fr', 'alemania': 'de', 'españa': 'es', 'portugal': 'pt', 'italia': 'it',
  'inglaterra': 'gb-eng', 'países bajos': 'nl', 'paises bajos': 'nl', 'bélgica': 'be', 'belgica': 'be',
  'polonia': 'pl', 'ucrania': 'ua', 'serbia': 'rs', 'turquía': 'tr', 'turquia': 'tr',
  'croacia': 'hr', 'dinamarca': 'dk', 'suecia': 'se', 'noruega': 'no', 'suiza': 'ch',
  'austria': 'at', 'república checa': 'cz', 'republica checa': 'cz', 'rep. checa': 'cz',
  'eslovenia': 'si', 'bosnia': 'ba',
  'japón': 'jp', 'japon': 'jp', 'corea del sur': 'kr', 'australia': 'au', 'india': 'in',
  'arabia saudita': 'sa', 'iran': 'ir', 'irán': 'ir',
  'marruecos': 'ma', 'argelia': 'dz', 'nigeria': 'ng', 'ghana': 'gh',
  'senegal': 'sn', 'camerún': 'cm', 'camerun': 'cm', 'costa de marfil': 'ci',
  'sudáfrica': 'za', 'sudafrica': 'za', 'angola': 'ao', 'tanzania': 'tz', 'burkina faso': 'bf',
}

function getFlag(equipo: string): string {
  const nombre = equipo.replace(/[^\w\sáéíóúñü]/g, '').toLowerCase().trim()
  for (const [key, code] of Object.entries(FLAG_MAP)) {
    if (nombre.includes(key)) return `https://flagcdn.com/w80/${code}.png`
  }
  return ''
}

function formatFechaCorta(fechaHora: string) {
  const d = new Date(fechaHora)
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatHora(fechaHora: string) {
  const d = new Date(fechaHora)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + 'hs'
}

function diasHastaInicio() {
  const inicio = new Date('2026-06-11T00:00:00-05:00')
  const ahora = new Date()
  const diff = inicio.getTime() - ahora.getTime()
  if (diff <= 0) return null
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const segs = Math.floor((diff % (1000 * 60)) / 1000)
  return { dias, horas, mins, segs }
}

export default function ProdePage() {
  const [screen, setScreen] = useState<Screen>('home')
  const [tabPartidos, setTabPartidos] = useState<TabPartidos>('pendientes')
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [pronosticos, setPronosticos] = useState<Record<string, Pronostico>>({})
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [puntaje, setPuntaje] = useState(0)
  const [miPos, setMiPos] = useState(0)
  const [exactos, setExactos] = useState(0)
  const [tendencias, setTendencias] = useState(0)
  const [countdown, setCountdown] = useState(diasHastaInicio())
  const [loading, setLoading] = useState(false)

  // Countdown
  useEffect(() => {
    const t = setInterval(() => setCountdown(diasHastaInicio()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('prode_usuario')
    if (saved) {
      const u = JSON.parse(saved)
      setUsuario(u)
      cargarDatos(u.id)
    }
  }, [])

  useEffect(() => {
    if (screen === 'jugar' || screen === 'ranking' || screen === 'home') {
      cargarPartidos()
      const i = setInterval(cargarPartidos, 60000)
      return () => clearInterval(i)
    }
  }, [screen])

  async function cargarPartidos() {
    const { data } = await supabase
      .from('partidos')
      .select('*')
      .order('fecha_hora', { ascending: true })
    if (data) setPartidos(data)
  }

  const cargarDatos = useCallback(async (userId: string) => {
    await cargarPartidos()
    const { data: prono } = await supabase.from('pronosticos').select('*').eq('usuario_id', userId)
    if (prono) {
      const map: Record<string, Pronostico> = {}
      prono.forEach(p => { map[p.partido_id] = p })
      setPronosticos(map)
    }
    const { data: pts } = await supabase.from('puntos').select('puntos, detalle').eq('usuario_id', userId)
    if (pts) {
      setPuntaje(pts.reduce((a, p) => a + p.puntos, 0))
      setExactos(pts.filter(p => p.detalle === 'exacto').length)
      setTendencias(pts.filter(p => p.detalle === 'tendencia').length)
    }
    const { data: rank } = await supabase.from('ranking').select('*').limit(50)
    if (rank) {
      setRanking(rank)
      const pos = rank.findIndex(r => r.id === userId)
      setMiPos(pos >= 0 ? pos + 1 : rank.length + 1)
    }
  }, [])



  // Agrupar partidos por fecha
  const partidosPendientes = partidos.filter(p => p.estado === 'abierto' || p.estado === 'pendiente' || p.estado === 'en_juego')
  const partidosCompletados = partidos.filter(p => p.estado === 'finalizado')
  const proximoPartido = partidosPendientes[0] || null

  function agruparPorFecha(lista: Partido[]) {
    const grupos: Record<string, Partido[]> = {}
    lista.forEach(p => {
      const fecha = formatFechaCorta(p.fecha_hora)
      if (!grupos[fecha]) grupos[fecha] = []
      grupos[fecha].push(p)
    })
    return grupos
  }

  const c = { bg: '#f5f5f5', white: '#ffffff', dark: '#1a1a1a', gold: '#c9a84c', muted: '#888', border: '#e8e8e8', green: '#22c55e', red: '#ef4444', blue: '#3b82f6' }

  // ── AUTH ──
  if (!usuario) return (
    <ProdeAuth onSuccess={(u) => {
      setUsuario(u)
      localStorage.setItem('prode_usuario', JSON.stringify(u))
      cargarDatos(u.id)
    }} />
  )

  return (
    <div style={{ background: c.bg, minHeight: '100vh', fontFamily: 'var(--font-sans), sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* TOPBAR */}
        <div style={{ background: c.dark, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: '#c9a84c', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>La Cocina · Prode</div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>Mundial 2026</div>
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>Hola, {usuario.nombre} 👋</div>
        </div>

        {/* ── HOME ── */}
        {screen === 'home' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 90 }}>

            {/* Mi Ranking Card */}
            <div style={{ margin: '16px 16px 0', background: c.white, borderRadius: 20, padding: 20, border: `1px solid ${c.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 14 }}>🏆</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tu Ranking</span>
                <button onClick={() => setScreen('ranking')} style={{ marginLeft: 'auto', fontSize: 12, color: c.blue, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Ver completo {'>'}</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 42, fontWeight: 900, color: c.green, lineHeight: 1 }}>#{miPos}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.dark }}>{puntaje} puntos</div>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>de {ranking.length} participantes</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: c.muted }}>✅ {exactos} exactos</div>
                  <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>🎯 {tendencias} tendencias</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                <button onClick={() => setScreen('jugar')}
                  style={{ background: c.dark, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  🎯 Predecir
                </button>
                <button onClick={() => setScreen('ranking')}
                  style={{ background: c.bg, color: c.dark, border: `1px solid ${c.border}`, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  🏆 Ver tabla
                </button>
              </div>
            </div>

            {/* Countdown si el mundial no empezó */}
            {countdown && (
              <div style={{ margin: '12px 16px 0', background: c.white, borderRadius: 16, padding: '14px 16px', border: `1px solid ${c.border}` }}>
                <div style={{ fontSize: 11, color: c.muted, fontWeight: 600, marginBottom: 10 }}>El torneo empieza en:</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ n: countdown.dias, l: 'D' }, { n: countdown.horas, l: 'H' }, { n: countdown.mins, l: 'M' }, { n: countdown.segs, l: 'S' }].map(({ n, l }) => (
                    <div key={l} style={{ flex: 1, background: c.bg, borderRadius: 10, padding: '8px 0', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: c.blue }}>{String(n).padStart(2, '0')}</div>
                      <div style={{ fontSize: 10, color: c.muted, fontWeight: 600 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Próximo partido */}
            {proximoPartido && (
              <div style={{ margin: '12px 16px 0', background: c.white, borderRadius: 16, padding: 16, border: `1px solid ${c.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 14 }}>⏱</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Próximo partido</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    {getFlag(proximoPartido.equipo_local) && <img src={getFlag(proximoPartido.equipo_local)} style={{ width: 32, height: 22, objectFit: 'cover', borderRadius: 4 }} alt="" />}
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.dark }}>{proximoPartido.equipo_local.replace(/[^\w\sáéíóúñü]/g, '').trim()}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: c.muted, fontWeight: 600 }}>VS</div>
                    <div style={{ fontSize: 10, color: c.muted, marginTop: 2 }}>{formatHora(proximoPartido.fecha_hora)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.dark, textAlign: 'right' }}>{proximoPartido.equipo_visitante.replace(/[^\w\sáéíóúñü]/g, '').trim()}</div>
                    {getFlag(proximoPartido.equipo_visitante) && <img src={getFlag(proximoPartido.equipo_visitante)} style={{ width: 32, height: 22, objectFit: 'cover', borderRadius: 4 }} alt="" />}
                  </div>
                </div>
                <button onClick={() => setScreen('jugar')}
                  style={{ marginTop: 14, background: c.dark, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}>
                  Predecir
                </button>
              </div>
            )}

            {/* Premios */}
            <div style={{ margin: '12px 16px 0' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: c.dark, marginBottom: 10 }}>🎁 Premio del Torneo</div>
              <div style={{ background: c.white, borderRadius: 16, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${c.border}` }}>
                  <span style={{ fontSize: 24 }}>🥇</span>
                  <div>
                    <div style={{ fontSize: 11, color: c.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>1er Puesto</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: c.dark }}>Combo para 2 personas</div>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${c.border}` }}>
                  <span style={{ fontSize: 24 }}>🥈</span>
                  <div>
                    <div style={{ fontSize: 11, color: c.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>2do Puesto</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: c.dark }}>Envío gratis x3</div>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>🥉</span>
                  <div>
                    <div style={{ fontSize: 11, color: '#CD7F32', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>3er Puesto</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: c.dark }}>20% descuento</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── JUGAR ── */}
        {screen === 'jugar' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 90 }}>
            <div style={{ padding: '14px 16px', background: c.white, borderBottom: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: c.dark }}>Partidos</div>
              <div style={{ display: 'flex', background: c.bg, borderRadius: 10, padding: 3, marginTop: 10 }}>
                {(['pendientes', 'completados'] as TabPartidos[]).map(t => (
                  <button key={t} onClick={() => setTabPartidos(t)}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: tabPartidos === t ? c.white : 'transparent', fontWeight: 700, fontSize: 13, color: tabPartidos === t ? c.dark : c.muted, cursor: 'pointer', fontFamily: 'inherit', boxShadow: tabPartidos === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                    {t === 'pendientes' ? 'Pendientes' : 'Completados'}
                  </button>
                ))}
              </div>
              {tabPartidos === 'pendientes' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#eff6ff', borderRadius: 10, padding: '10px 12px', marginTop: 10 }}>
                  <span style={{ fontSize: 14 }}>ℹ️</span>
                  <span style={{ fontSize: 12, color: c.blue }}>Cuantos más partidos completás, más puntos podés sumar</span>
                </div>
              )}
            </div>

            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {Object.entries(agruparPorFecha(tabPartidos === 'pendientes' ? partidosPendientes : partidosCompletados)).map(([fecha, ps]) => (
                <div key={fecha}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: c.dark, padding: '12px 0 8px', textTransform: 'capitalize' }}>{fecha}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ps.map(p => (
                      <PartidoCard key={p.id} partido={p} pronostico={pronosticos[p.id]}
                        usuarioId={usuario.id} onGuardado={() => cargarDatos(usuario.id)} />
                    ))}
                  </div>
                </div>
              ))}
              {(tabPartidos === 'pendientes' ? partidosPendientes : partidosCompletados).length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: c.muted, fontSize: 13 }}>
                  {tabPartidos === 'pendientes' ? 'No hay partidos pendientes' : 'Todavía no hay partidos completados'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RANKING ── */}
        {screen === 'ranking' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 90 }}>
            <div style={{ padding: '14px 16px', background: c.white, borderBottom: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: c.dark }}>Tabla de posiciones</div>
              <div style={{ fontSize: 12, color: c.muted, marginTop: 3 }}>Mundial 2026 · En tiempo real</div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ranking.map((r, i) => {
                const esVos = r.id === usuario.id
                return (
                  <div key={r.id} style={{ background: esVos ? c.dark : c.white, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${esVos ? c.dark : c.border}` }}>
                    <div style={{ fontSize: 18, fontWeight: 900, minWidth: 32, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : esVos ? '#fff' : c.muted }}>
                      {i < 3 ? ['🥇','🥈','🥉'][i] : `${i+1}`}
                    </div>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: esVos ? '#ffffff22' : c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: esVos ? '#fff' : c.muted, flexShrink: 0 }}>
                      {r.nombre[0]}{r.apellido[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: esVos ? '#fff' : c.dark, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {r.nombre} {r.apellido[0]}.
                        {esVos && <span style={{ fontSize: 10, background: c.gold, color: '#1a1000', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>Vos</span>}
                      </div>
                      <div style={{ fontSize: 11, color: esVos ? '#ffffff88' : c.muted, marginTop: 2 }}>{r.exactos} exactos · {r.tendencias} tendencias</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: esVos ? '#fff' : c.dark, lineHeight: 1 }}>{r.total}</div>
                      <div style={{ fontSize: 10, color: esVos ? '#ffffff66' : c.muted }}>pts</div>
                    </div>
                  </div>
                )
              })}
              {ranking.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: c.muted, fontSize: 13 }}>Todavía no hay puntajes cargados</div>}
            </div>
          </div>
        )}

        {/* BOTTOM NAV */}
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: c.white, borderTop: `1px solid ${c.border}`, display: 'flex', padding: '8px 0 20px', zIndex: 10 }}>
          {([
            { id: 'home', label: 'Inicio', icon: '🏠' },
            { id: 'jugar', label: 'Predecir', icon: '🎯' },
            { id: 'ranking', label: 'Ranking', icon: '🏆' },
          ] as const).map(n => (
            <button key={n.id} onClick={() => { setScreen(n.id); if (usuario) cargarDatos(usuario.id) }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 20 }}>{n.icon}</span>
              <span style={{ fontSize: 10, color: screen === n.id ? c.dark : c.muted, fontWeight: screen === n.id ? 700 : 500 }}>{n.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TARJETA DE PARTIDO ──
function PartidoCard({ partido, pronostico, usuarioId, onGuardado }: {
  partido: Partido; pronostico: Pronostico | undefined
  usuarioId: string; onGuardado: () => void
}) {
  const [local, setLocal] = useState<string>(pronostico?.goles_local?.toString() ?? '')
  const [visitante, setVisitante] = useState<string>(pronostico?.goles_visitante?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!pronostico)
  const abierto = partido.estado === 'abierto' && new Date() < new Date(partido.fecha_hora)
  const c = { white: '#ffffff', dark: '#1a1a1a', muted: '#888', border: '#e8e8e8', bg: '#f5f5f5', green: '#22c55e', red: '#ef4444', blue: '#3b82f6' }

  async function guardar() {
    if (local === '' || visitante === '') { alert('Completá los dos marcadores'); return }
    setSaving(true)
    await supabase.from('pronosticos').upsert({ usuario_id: usuarioId, partido_id: partido.id, goles_local: Number(local), goles_visitante: Number(visitante) }, { onConflict: 'usuario_id,partido_id' })
    setSaving(false)
    setSaved(true)
    onGuardado()
  }

  function getFlag(equipo: string): string {
    const FLAG_MAP: Record<string, string> = {
      'argentina': 'ar', 'chile': 'cl', 'perú': 'pe', 'peru': 'pe', 'brasil': 'br',
      'uruguay': 'uy', 'colombia': 'co', 'venezuela': 've', 'ecuador': 'ec', 'bolivia': 'bo',
      'paraguay': 'py', 'mexico': 'mx', 'méxico': 'mx', 'estados unidos': 'us',
      'canadá': 'ca', 'canada': 'ca', 'panamá': 'pa', 'jamaica': 'jm',
      'francia': 'fr', 'alemania': 'de', 'españa': 'es', 'portugal': 'pt', 'italia': 'it',
      'países bajos': 'nl', 'paises bajos': 'nl', 'bélgica': 'be', 'belgica': 'be',
      'polonia': 'pl', 'ucrania': 'ua', 'serbia': 'rs', 'turquía': 'tr', 'turquia': 'tr',
      'república checa': 'cz', 'rep. checa': 'cz', 'eslovenia': 'si', 'bosnia': 'ba',
      'japón': 'jp', 'japon': 'jp', 'corea del sur': 'kr', 'australia': 'au',
      'arabia saudita': 'sa', 'iran': 'ir', 'irán': 'ir', 'marruecos': 'ma',
      'argelia': 'dz', 'nigeria': 'ng', 'ghana': 'gh', 'senegal': 'sn',
      'camerún': 'cm', 'camerun': 'cm', 'sudáfrica': 'za', 'sudafrica': 'za',
      'angola': 'ao', 'burkina faso': 'bf',
    }
    const nombre = equipo.replace(/[^\w\sáéíóúñü]/g, '').toLowerCase().trim()
    for (const [key, code] of Object.entries(FLAG_MAP)) {
      if (nombre.includes(key)) return `https://flagcdn.com/w80/${code}.png`
    }
    return ''
  }

  const nombreLocal = partido.equipo_local.replace(/[^\w\sáéíóúñü]/g, '').trim()
  const nombreVisitante = partido.equipo_visitante.replace(/[^\w\sáéíóúñü]/g, '').trim()

  return (
    <div style={{ background: c.white, borderRadius: 16, border: `1px solid ${saved ? '#bbf7d0' : c.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: c.dark }}>Grupo {partido.grupo}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {partido.en_vivo && <div style={{ width: 6, height: 6, background: c.red, borderRadius: '50%' }} />}
          <span style={{ fontSize: 12, fontWeight: 700, color: partido.en_vivo ? c.red : abierto ? c.green : c.muted }}>
            {partido.en_vivo ? `EN VIVO ${partido.minuto ? partido.minuto + "'" : ''}` : abierto ? formatHora(partido.fecha_hora) : formatHora(partido.fecha_hora)}
          </span>
        </div>
      </div>
      <div style={{ padding: '18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Local */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {getFlag(partido.equipo_local)
              ? <img src={getFlag(partido.equipo_local)} style={{ width: 56, height: 38, objectFit: 'cover', borderRadius: 6, border: `1px solid ${c.border}` }} alt="" />
              : <div style={{ width: 56, height: 38, background: c.bg, borderRadius: 6, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏳️</div>
            }
            <div style={{ fontSize: 12, fontWeight: 700, color: c.dark, textAlign: 'center', lineHeight: 1.3 }}>{nombreLocal}</div>
          </div>
          {/* Marcador */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {partido.en_vivo && partido.goles_local !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 44, height: 44, background: c.red, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff' }}>{partido.goles_local}</div>
                <span style={{ fontSize: 18, color: c.muted, fontWeight: 700 }}>-</span>
                <div style={{ width: 44, height: 44, background: c.red, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff' }}>{partido.goles_visitante}</div>
              </div>
            ) : partido.estado === 'finalizado' && partido.goles_local !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 44, height: 44, background: c.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: c.dark, border: `1px solid ${c.border}` }}>{partido.goles_local}</div>
                <span style={{ fontSize: 18, color: c.muted, fontWeight: 700 }}>-</span>
                <div style={{ width: 44, height: 44, background: c.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: c.dark, border: `1px solid ${c.border}` }}>{partido.goles_visitante}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" min={0} max={20} value={local} onChange={e => setLocal(e.target.value)} disabled={!abierto} placeholder="-"
                  style={{ width: 44, height: 44, background: abierto ? '#fff' : c.bg, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 22, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit', color: c.dark, opacity: abierto ? 1 : 0.6 }} />
                <span style={{ fontSize: 18, color: c.muted, fontWeight: 700 }}>VS</span>
                <input type="number" min={0} max={20} value={visitante} onChange={e => setVisitante(e.target.value)} disabled={!abierto} placeholder="-"
                  style={{ width: 44, height: 44, background: abierto ? '#fff' : c.bg, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 22, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit', color: c.dark, opacity: abierto ? 1 : 0.6 }} />
              </div>
            )}
            {partido.estado === 'finalizado' && pronostico && (
              <div style={{ fontSize: 10, color: c.muted, marginTop: 2 }}>
                Tu pronóstico: {pronostico.goles_local}-{pronostico.goles_visitante}
              </div>
            )}
          </div>
          {/* Visitante */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {getFlag(partido.equipo_visitante)
              ? <img src={getFlag(partido.equipo_visitante)} style={{ width: 56, height: 38, objectFit: 'cover', borderRadius: 6, border: `1px solid ${c.border}` }} alt="" />
              : <div style={{ width: 56, height: 38, background: c.bg, borderRadius: 6, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏳️</div>
            }
            <div style={{ fontSize: 12, fontWeight: 700, color: c.dark, textAlign: 'center', lineHeight: 1.3 }}>{nombreVisitante}</div>
          </div>
        </div>
      </div>
      {abierto && (
        <div style={{ padding: '0 14px 14px' }}>
          <button onClick={guardar} disabled={saving}
            style={{ background: saved ? '#f0fdf4' : c.dark, color: saved ? c.green : '#fff', border: `1px solid ${saved ? '#bbf7d0' : c.dark}`, borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}>
            {saving ? 'Guardando...' : saved ? '✓ Guardado · Toca para actualizar' : 'Guardar pronóstico'}
          </button>
        </div>
      )}
    </div>
  )
}