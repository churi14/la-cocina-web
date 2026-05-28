'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ── TIPOS ──
interface Partido {
  id: string
  equipo_local: string
  equipo_visitante: string
  fecha_hora: string
  goles_local: number | null
  goles_visitante: number | null
  en_vivo: boolean
  estado: string
  grupo: string
  fase: string
  minuto: number | null
}

interface Usuario {
  id: string
  nombre: string
  apellido: string
  telefono: string
  created_at: string
}

interface RankingItem {
  id: string
  nombre: string
  apellido: string
  telefono: string
  total: number
  exactos: number
  tendencias: number
}

interface Premio {
  id: string
  usuario_id: string
  descripcion: string
  canjeado: boolean
  created_at: string
  usuarios?: { nombre: string; apellido: string; telefono: string }
}

// ── PARTIDOS MUNDIAL PRECARGADOS ──
const PARTIDOS_MUNDIAL = [
  { local: '🇲🇽 México', visitante: '🇧🇴 Bolivia', grupo: 'A', fecha: '2026-06-11T13:00:00-05:00' },
  { local: '🇺🇸 Estados Unidos', visitante: '🇧🇫 Burkina Faso', grupo: 'A', fecha: '2026-06-12T16:00:00-05:00' },
  { local: '🇲🇽 México', visitante: '🇺🇸 Estados Unidos', grupo: 'A', fecha: '2026-06-19T20:00:00-05:00' },
  { local: '🇦🇷 Argentina', visitante: '🇨🇱 Chile', grupo: 'B', fecha: '2026-06-12T19:00:00-05:00' },
  { local: '🇵🇪 Perú', visitante: '🇦🇴 Angola', grupo: 'B', fecha: '2026-06-12T13:00:00-05:00' },
  { local: '🇦🇷 Argentina', visitante: '🇵🇪 Perú', grupo: 'B', fecha: '2026-06-19T20:00:00-05:00' },
  { local: '🇨🇱 Chile', visitante: '🇦🇴 Angola', grupo: 'B', fecha: '2026-06-19T13:00:00-05:00' },
  { local: '🇦🇴 Angola', visitante: '🇦🇷 Argentina', grupo: 'B', fecha: '2026-06-25T20:00:00-05:00' },
  { local: '🇧🇷 Brasil', visitante: '🇺🇾 Uruguay', grupo: 'C', fecha: '2026-06-13T19:00:00-05:00' },
  { local: '🇨🇴 Colombia', visitante: '🇨🇲 Camerún', grupo: 'C', fecha: '2026-06-13T13:00:00-05:00' },
  { local: '🇧🇷 Brasil', visitante: '🇨🇴 Colombia', grupo: 'C', fecha: '2026-06-20T20:00:00-05:00' },
  { local: '🇺🇾 Uruguay', visitante: '🇨🇲 Camerún', grupo: 'C', fecha: '2026-06-20T16:00:00-05:00' },
  { local: '🇫🇷 Francia', visitante: '🇩🇿 Argelia', grupo: 'D', fecha: '2026-06-14T16:00:00-05:00' },
  { local: '🇩🇪 Alemania', visitante: '🇯🇵 Japón', grupo: 'D', fecha: '2026-06-14T13:00:00-05:00' },
  { local: '🇫🇷 Francia', visitante: '🇩🇪 Alemania', grupo: 'D', fecha: '2026-06-21T20:00:00-05:00' },
  { local: '🇪🇸 España', visitante: '🇲🇦 Marruecos', grupo: 'E', fecha: '2026-06-14T19:00:00-05:00' },
  { local: '🇵🇹 Portugal', visitante: '🇹🇿 Tanzania', grupo: 'E', fecha: '2026-06-15T13:00:00-05:00' },
  { local: '🇪🇸 España', visitante: '🇵🇹 Portugal', grupo: 'E', fecha: '2026-06-22T20:00:00-05:00' },
  { local: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', visitante: '🇸🇳 Senegal', grupo: 'F', fecha: '2026-06-15T16:00:00-05:00' },
  { local: '🇳🇱 Países Bajos', visitante: '🇧🇦 Bosnia', grupo: 'F', fecha: '2026-06-15T19:00:00-05:00' },
  { local: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', visitante: '🇳🇱 Países Bajos', grupo: 'F', fecha: '2026-06-22T20:00:00-05:00' },
  { local: '🇮🇹 Italia', visitante: '🇿🇦 Sudáfrica', grupo: 'G', fecha: '2026-06-16T13:00:00-05:00' },
  { local: '🇧🇪 Bélgica', visitante: '🇪🇨 Ecuador', grupo: 'G', fecha: '2026-06-16T16:00:00-05:00' },
  { local: '🇮🇹 Italia', visitante: '🇧🇪 Bélgica', grupo: 'G', fecha: '2026-06-23T20:00:00-05:00' },
  { local: '🇰🇷 Corea del Sur', visitante: '🇬🇭 Ghana', grupo: 'H', fecha: '2026-06-16T19:00:00-05:00' },
  { local: '🇦🇺 Australia', visitante: '🇮🇳 India', grupo: 'H', fecha: '2026-06-17T13:00:00-05:00' },
  { local: '🇰🇷 Corea del Sur', visitante: '🇦🇺 Australia', grupo: 'H', fecha: '2026-06-23T20:00:00-05:00' },
  { local: '🇻🇪 Venezuela', visitante: '🇳🇬 Nigeria', grupo: 'I', fecha: '2026-06-17T19:00:00-05:00' },
  { local: '🇵🇦 Panamá', visitante: '🇻🇪 Venezuela', grupo: 'I', fecha: '2026-06-24T16:00:00-05:00' },
  { local: '🇹🇷 Turquía', visitante: '🇨🇿 Rep. Checa', grupo: 'J', fecha: '2026-06-18T16:00:00-05:00' },
  { local: '🇯🇲 Jamaica', visitante: '🇸🇦 Arabia Saudita', grupo: 'J', fecha: '2026-06-18T13:00:00-05:00' },
  { local: '🇺🇦 Ucrania', visitante: '🇷🇸 Serbia', grupo: 'K', fecha: '2026-06-19T13:00:00-05:00' },
  { local: '🇵🇱 Polonia', visitante: '🇨🇮 Costa de Marfil', grupo: 'K', fecha: '2026-06-18T19:00:00-05:00' },
  { local: '🇨🇦 Canadá', visitante: '🇸🇮 Eslovenia', grupo: 'L', fecha: '2026-06-20T16:00:00-05:00' },
  { local: '🇨🇦 Canadá', visitante: '🇮🇷 Irán', grupo: 'L', fecha: '2026-07-03T18:00:00-05:00' },
]

type AdminScreen = 'dashboard' | 'partidos' | 'resultados' | 'jugadores' | 'premios'

export default function ProdeAdmin() {
  const [authed, setAuthed] = useState(false)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [screen, setScreen] = useState<AdminScreen>('dashboard')

  const [partidos, setPartidos] = useState<Partido[]>([])
  const [jugadores, setJugadores] = useState<Usuario[]>([])
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [premios, setPremios] = useState<Premio[]>([])

  const [grupoFiltro, setGrupoFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [resultadoEdit, setResultadoEdit] = useState<Record<string, { l: string; v: string }>>({})
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (authed) {
      cargarTodo()
    }
  }, [authed])

  async function cargarTodo() {
    const [{ data: p }, { data: u }, { data: r }, { data: pr }] = await Promise.all([
      supabase.from('partidos').select('*').order('fecha_hora'),
      supabase.from('usuarios').select('*').order('created_at', { ascending: false }),
      supabase.from('ranking').select('*'),
      supabase.from('premios').select('*, usuarios(nombre, apellido, telefono)').order('created_at', { ascending: false }),
    ])
    if (p) setPartidos(p)
    if (u) setJugadores(u)
    if (r) setRanking(r)
    if (pr) setPremios(pr)
  }

  function login() {
    if (user === 'admin' && pass === 'lacocina2026') {
      setAuthed(true)
    } else {
      alert('Usuario o contraseña incorrectos')
    }
  }

  // Activar partido del mundial
  async function activarPartido(p: typeof PARTIDOS_MUNDIAL[0]) {
    setLoading(true)
    const { error } = await supabase.from('partidos').insert({
      equipo_local: p.local,
      equipo_visitante: p.visitante,
      fecha_hora: p.fecha,
      grupo: p.grupo,
      fase: 'grupos',
      estado: 'abierto',
    })
    if (!error) {
      setMsg(`✅ ${p.local} vs ${p.visitante} activado`)
      await cargarTodo()
    }
    setLoading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  // Cargar resultado y calcular puntos
  async function confirmarResultado(partido: Partido) {
    const res = resultadoEdit[partido.id]
    if (!res || res.l === '' || res.v === '') { alert('Ingresá los dos goles'); return }

    setLoading(true)
    const gl = parseInt(res.l)
    const gv = parseInt(res.v)

    // 1. Actualizar partido
    await supabase.from('partidos').update({
      goles_local: gl,
      goles_visitante: gv,
      estado: 'finalizado',
      en_vivo: false,
    }).eq('id', partido.id)

    // 2. Traer todos los pronósticos de este partido
    const { data: pronos } = await supabase
      .from('pronosticos')
      .select('*')
      .eq('partido_id', partido.id)

    if (pronos && pronos.length > 0) {
      // 3. Calcular puntos para cada usuario
      const inserts = pronos.map(pr => {
        let puntos = 0
        let detalle = 'error'

        if (pr.goles_local === gl && pr.goles_visitante === gv) {
          puntos = 3
          detalle = 'exacto'
        } else {
          const tendenciaReal = gl > gv ? 'L' : gl < gv ? 'V' : 'E'
          const tendenciaPron = pr.goles_local > pr.goles_visitante ? 'L' : pr.goles_local < pr.goles_visitante ? 'V' : 'E'
          if (tendenciaReal === tendenciaPron) {
            puntos = 1
            detalle = 'tendencia'
          }
        }
        return { usuario_id: pr.usuario_id, partido_id: partido.id, puntos, detalle }
      })

      await supabase.from('puntos').upsert(inserts, { onConflict: 'usuario_id,partido_id' })
    }

    setMsg(`✅ Resultado ${gl}-${gv} guardado. Puntos calculados para ${pronos?.length || 0} jugadores.`)
    await cargarTodo()
    setLoading(false)
    setTimeout(() => setMsg(''), 4000)
  }

  // Marcar partido en vivo
  async function toggleEnVivo(partido: Partido) {
    await supabase.from('partidos').update({
      en_vivo: !partido.en_vivo,
      estado: !partido.en_vivo ? 'en_juego' : 'abierto',
    }).eq('id', partido.id)
    await cargarTodo()
  }

  // Asignar premio
  async function asignarPremio(usuarioId: string, descripcion: string) {
    await supabase.from('premios').insert({ usuario_id: usuarioId, descripcion })
    setMsg('✅ Premio asignado')
    await cargarTodo()
    setTimeout(() => setMsg(''), 3000)
  }

  // Marcar premio canjeado
  async function marcarCanjeado(premioId: string) {
    await supabase.from('premios').update({ canjeado: true }).eq('id', premioId)
    await cargarTodo()
  }

  const s = { background: '#0d0d0d', color: '#f0ede8', fontFamily: 'var(--font-sans), sans-serif', minHeight: '100vh' }
  const surface = { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16 }
  const gold = '#c9a84c'
  const muted = '#7a7570'

  // ── LOGIN ──
  if (!authed) return (
    <div style={{ ...s, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ ...surface, padding: '36px 32px', width: '100%', maxWidth: 380 }}>
        <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 16 }}>🔐</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, textAlign: 'center' }}>Panel de Admin</h1>
        <p style={{ fontSize: 12, color: muted, textAlign: 'center', marginTop: 4 }}>Prode Mundial 2026 · La Cocina</p>
        {[
          { label: 'Usuario', val: user, set: setUser, type: 'text', ph: 'admin' },
          { label: 'Contraseña', val: pass, set: setPass, type: 'password', ph: '••••••••' },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 20 }}>
            <label style={{ fontSize: 11, color: muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</label>
            <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              onKeyDown={e => e.key === 'Enter' && login()}
              style={{ background: '#222', border: '1px solid #2a2a2a', borderRadius: 12, padding: '12px 16px', color: '#f0ede8', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </div>
        ))}
        <button onClick={login} style={{ background: gold, color: '#1a1000', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: 'inherit', marginTop: 20 }}>
          Ingresar →
        </button>
      </div>
    </div>
  )

  // ── ADMIN LAYOUT ──
  return (
    <div style={{ ...s, display: 'flex', flexDirection: 'column' }}>

      {/* TOPBAR */}
      <div style={{ background: '#0d0d0d', borderBottom: '1px solid #2a2a2a', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, background: '#e05c2a', borderRadius: '50%' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ff7a47', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin · Prode</div>
            <div style={{ fontSize: 10, color: muted }}>Mundial 2026 · La Cocina Ushuaia</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {msg && <div style={{ fontSize: 12, color: '#52b38e', fontWeight: 600 }}>{msg}</div>}
          <button onClick={() => setAuthed(false)} style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 12px', color: muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Salir</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* SIDEBAR */}
        <div style={{ width: 200, background: '#111', borderRight: '1px solid #2a2a2a', padding: '20px 0', flexShrink: 0, position: 'sticky', top: 57, height: 'calc(100vh - 57px)', overflowY: 'auto' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '▦' },
            { id: 'partidos', label: 'Partidos', icon: '⏱' },
            { id: 'resultados', label: 'Resultados', icon: '✓' },
            { id: 'jugadores', label: 'Jugadores', icon: '👥' },
            { id: 'premios', label: 'Premios', icon: '🎁' },
          ].map(item => (
            <button key={item.id} onClick={() => setScreen(item.id as AdminScreen)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 13, fontWeight: 500, color: screen === item.id ? gold : muted, cursor: 'pointer', border: 'none', background: screen === item.id ? '#1a1500' : 'none', width: '100%', fontFamily: 'inherit', borderLeft: `3px solid ${screen === item.id ? gold : 'transparent'}`, textAlign: 'left' }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

          {/* ── DASHBOARD ── */}
          {screen === 'dashboard' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Dashboard</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Jugadores', num: jugadores.length },
                  { label: 'Partidos activos', num: partidos.filter(p => p.estado === 'abierto').length },
                  { label: 'En vivo ahora', num: partidos.filter(p => p.en_vivo).length },
                  { label: 'Premios pendientes', num: premios.filter(p => !p.canjeado).length },
                ].map(s => (
                  <div key={s.label} style={{ ...surface, padding: 16 }}>
                    <div style={{ fontSize: 11, color: muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: gold, marginTop: 6 }}>{s.num}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Top 5 ranking</div>
              <div style={{ ...surface, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                    {['#', 'Jugador', 'Exactos', 'Tendencias', 'Total'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, color: muted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {ranking.slice(0, 5).map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: ['#FFD700','#C0C0C0','#CD7F32'][i] || muted }}>{i+1}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.nombre} {r.apellido}</td>
                        <td style={{ padding: '12px 16px', color: muted }}>{r.exactos}</td>
                        <td style={{ padding: '12px 16px', color: muted }}>{r.tendencias}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: gold }}>{r.total} pts</td>
                      </tr>
                    ))}
                    {ranking.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: muted }}>Todavía no hay puntajes</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PARTIDOS ── */}
          {screen === 'partidos' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Partidos del Prode</div>
              <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>Buscá y activá los partidos del Mundial 2026</div>

              {/* BUSCADOR */}
              <div style={{ ...surface, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a2a' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>⚽ Partidos del Mundial 2026</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['todos','A','B','C','D','E','F','G','H','I','J','K','L'].map(g => (
                      <button key={g} onClick={() => setGrupoFiltro(g)}
                        style={{ background: grupoFiltro === g ? '#1a1500' : '#222', border: `1px solid ${grupoFiltro === g ? gold : '#2a2a2a'}`, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: grupoFiltro === g ? gold : muted, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {g === 'todos' ? 'Todos' : `Grupo ${g}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '10px 20px', borderBottom: '1px solid #2a2a2a' }}>
                  <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por equipo... ej: Argentina, Brasil"
                    style={{ width: '100%', background: '#222', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 14px', color: '#f0ede8', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {PARTIDOS_MUNDIAL
                    .filter(p => (grupoFiltro === 'todos' || p.grupo === grupoFiltro) &&
                      (!busqueda || p.local.toLowerCase().includes(busqueda.toLowerCase()) || p.visitante.toLowerCase().includes(busqueda.toLowerCase())))
                    .map((p, i) => {
                      const yaActivado = partidos.some(pa => pa.equipo_local === p.local && pa.equipo_visitante === p.visitante)
                      const fecha = new Date(p.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
                      const hora = new Date(p.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #1e1e1e', opacity: yaActivado ? 0.5 : 1 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.local} vs {p.visitante}</div>
                            <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>Grupo {p.grupo} · {fecha} · {hora}hs</div>
                          </div>
                          {yaActivado ? (
                            <span style={{ fontSize: 12, color: '#52b38e', fontWeight: 700 }}>✓ Activado</span>
                          ) : (
                            <button onClick={() => activarPartido(p)} disabled={loading}
                              style={{ background: '#1a1500', color: gold, border: `1px solid #3a2a00`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              + Activar
                            </button>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* PARTIDOS ACTIVADOS */}
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Partidos activados ({partidos.length})</div>
              <div style={{ ...surface, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                    {['Partido','Fecha','Grupo','Estado','En vivo',''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, color: muted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {partidos.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.equipo_local} vs {p.equipo_visitante}</td>
                        <td style={{ padding: '12px 16px', color: muted, fontSize: 12 }}>{new Date(p.fecha_hora).toLocaleDateString('es-AR')}</td>
                        <td style={{ padding: '12px 16px' }}><span style={{ background: '#1e1e1e', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: muted }}>Grupo {p.grupo}</span></td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: p.estado === 'abierto' ? '#0a2a1a' : p.estado === 'finalizado' ? '#1e1e1e' : '#2a0a00', color: p.estado === 'abierto' ? '#52b38e' : p.estado === 'finalizado' ? muted : '#ff7a47', border: `1px solid ${p.estado === 'abierto' ? '#1a5a38' : p.estado === 'finalizado' ? '#2a2a2a' : '#5a2010'}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                            {p.estado}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => toggleEnVivo(p)}
                            style={{ background: p.en_vivo ? '#0a2a1a' : '#222', color: p.en_vivo ? '#52b38e' : muted, border: `1px solid ${p.en_vivo ? '#1a5a38' : '#2a2a2a'}`, borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {p.en_vivo ? '🔴 En vivo' : 'Activar'}
                          </button>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={async () => { await supabase.from('partidos').delete().eq('id', p.id); cargarTodo() }}
                            style={{ background: 'none', color: '#e05c2a', border: '1px solid #5a2010', borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {partidos.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: muted }}>No hay partidos activados todavía</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── RESULTADOS ── */}
          {screen === 'resultados' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Cargar resultados</div>
              <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>Al confirmar se calculan los puntos automáticamente para todos los jugadores</div>
              <div style={{ ...surface, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                    {['Partido','Estado','Resultado oficial','Acción'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, color: muted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {partidos.filter(p => p.estado !== 'pendiente').map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600 }}>{p.equipo_local} vs {p.equipo_visitante}</div>
                          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>Grupo {p.grupo}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: p.estado === 'finalizado' ? '#1e1e1e' : '#0a2a1a', color: p.estado === 'finalizado' ? muted : '#52b38e', border: `1px solid ${p.estado === 'finalizado' ? '#2a2a2a' : '#1a5a38'}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                            {p.estado}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {p.estado === 'finalizado' ? (
                            <span style={{ fontWeight: 700, color: '#52b38e' }}>{p.goles_local} - {p.goles_visitante}</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input type="number" min={0} max={20} placeholder="0"
                                value={resultadoEdit[p.id]?.l || ''}
                                onChange={e => setResultadoEdit(prev => ({ ...prev, [p.id]: { ...prev[p.id], l: e.target.value } }))}
                                style={{ width: 48, background: '#222', border: '1px solid #3a2a00', borderRadius: 8, padding: '6px', color: '#f0ede8', fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
                              <span style={{ color: muted, fontWeight: 700 }}>-</span>
                              <input type="number" min={0} max={20} placeholder="0"
                                value={resultadoEdit[p.id]?.v || ''}
                                onChange={e => setResultadoEdit(prev => ({ ...prev, [p.id]: { ...prev[p.id], v: e.target.value } }))}
                                style={{ width: 48, background: '#222', border: '1px solid #3a2a00', borderRadius: 8, padding: '6px', color: '#f0ede8', fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {p.estado !== 'finalizado' && (
                            <button onClick={() => confirmarResultado(p)} disabled={loading}
                              style={{ background: '#3a8f6e', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Confirmar y calcular
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {partidos.filter(p => p.estado !== 'pendiente').length === 0 && (
                      <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: muted }}>No hay partidos cerrados todavía</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── JUGADORES ── */}
          {screen === 'jugadores' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Jugadores registrados</div>
              <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>{jugadores.length} jugadores activos</div>
              <div style={{ ...surface, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                    {['Jugador','WhatsApp','Registro','Puntaje','Premio'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, color: muted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {jugadores.map(u => {
                      const rank = ranking.find(r => r.id === u.id)
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.nombre} {u.apellido}</td>
                          <td style={{ padding: '12px 16px', color: muted }}>{u.telefono}</td>
                          <td style={{ padding: '12px 16px', color: muted, fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: gold }}>{rank?.total || 0} pts</td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={() => { const desc = prompt('Descripción del premio:'); if (desc) asignarPremio(u.id, desc) }}
                              style={{ background: '#1a1500', color: gold, border: `1px solid #3a2a00`, borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              + Asignar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {jugadores.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: muted }}>Todavía no hay jugadores registrados</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PREMIOS ── */}
          {screen === 'premios' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Premios</div>
              <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>Gestioná los premios entregados</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total entregados', num: premios.length },
                  { label: 'Sin canjear', num: premios.filter(p => !p.canjeado).length, color: '#ff7a47' },
                  { label: 'Canjeados', num: premios.filter(p => p.canjeado).length, color: '#52b38e' },
                ].map(s => (
                  <div key={s.label} style={{ ...surface, padding: 16 }}>
                    <div style={{ fontSize: 11, color: muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color || gold, marginTop: 6 }}>{s.num}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...surface, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                    {['Jugador','Premio','Fecha','Estado','Acción'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, color: muted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {premios.map(pr => (
                      <tr key={pr.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{pr.usuarios?.nombre} {pr.usuarios?.apellido}<div style={{ fontSize: 11, color: muted }}>{pr.usuarios?.telefono}</div></td>
                        <td style={{ padding: '12px 16px' }}>{pr.descripcion}</td>
                        <td style={{ padding: '12px 16px', color: muted, fontSize: 12 }}>{new Date(pr.created_at).toLocaleDateString('es-AR')}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: pr.canjeado ? '#1a1500' : '#2a0a00', color: pr.canjeado ? gold : '#ff7a47', border: `1px solid ${pr.canjeado ? '#3a2a00' : '#5a2010'}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                            {pr.canjeado ? 'Canjeado' : 'Pendiente'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {!pr.canjeado && (
                            <button onClick={() => marcarCanjeado(pr.id)}
                              style={{ background: '#0a2a1a', color: '#52b38e', border: '1px solid #1a5a38', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Marcar canjeado
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {premios.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: muted }}>No hay premios asignados todavía</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}