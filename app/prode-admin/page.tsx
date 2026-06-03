'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

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

type AdminScreen = 'dashboard' | 'resultados' | 'jugadores' | 'premios' | 'notif'

export default function ProdeAdmin() {
  const [authed, setAuthed] = useState(false)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [screen, setScreen] = useState<AdminScreen>('dashboard')

  const [partidos, setPartidos] = useState<Partido[]>([])
  const [jugadores, setJugadores] = useState<Usuario[]>([])
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [premios, setPremios] = useState<Premio[]>([])
  const [resultadoEdit, setResultadoEdit] = useState<Record<string, { l: string; v: string }>>({})
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const supabase = authed ? createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  ) : null

  useEffect(() => {
    if (authed) cargarTodo()
  }, [authed])

  async function cargarTodo() {
    if (!supabase) return
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
    if (user === 'admin' && pass === 'lacocina2026') setAuthed(true)
    else alert('Usuario o contraseña incorrectos')
  }

  async function confirmarResultado(partido: Partido) {
    if (!supabase) return
    const res = resultadoEdit[partido.id]
    if (!res || res.l === '' || res.v === '') { alert('Ingresá los dos goles'); return }
    setLoading(true)
    const gl = parseInt(res.l)
    const gv = parseInt(res.v)

    await supabase.from('partidos').update({
      goles_local: gl, goles_visitante: gv,
      estado: 'finalizado', en_vivo: false,
    }).eq('id', partido.id)

    const { data: pronos } = await supabase.from('pronosticos').select('*').eq('partido_id', partido.id)

    if (pronos && pronos.length > 0) {
      const inserts = pronos.map(pr => {
        let puntos = 0
        let detalle = 'error'
        if (pr.goles_local === gl && pr.goles_visitante === gv) {
          puntos = 3; detalle = 'exacto'
        } else {
          const tReal = gl > gv ? 'L' : gl < gv ? 'V' : 'E'
          const tPron = pr.goles_local > pr.goles_visitante ? 'L' : pr.goles_local < pr.goles_visitante ? 'V' : 'E'
          if (tReal === tPron) { puntos = 1; detalle = 'tendencia' }
        }
        return { usuario_id: pr.usuario_id, partido_id: partido.id, puntos, detalle }
      })
      await supabase.from('puntos').upsert(inserts, { onConflict: 'usuario_id,partido_id' })
    }

    setMsg(`✅ ${gl}-${gv} guardado. Puntos calculados para ${pronos?.length || 0} jugadores.`)
    await cargarTodo()
    setLoading(false)
    setTimeout(() => setMsg(''), 4000)
  }

  async function toggleEnVivo(partido: Partido) {
    if (!supabase) return
    await supabase.from('partidos').update({
      en_vivo: !partido.en_vivo,
      estado: !partido.en_vivo ? 'en_juego' : 'abierto',
    }).eq('id', partido.id)
    await cargarTodo()
  }

  async function marcarCanjeado(premioId: string) {
    if (!supabase) return
    await supabase.from('premios').update({ canjeado: true }).eq('id', premioId)
    await cargarTodo()
  }

  async function asignarPremio(usuarioId: string) {
    if (!supabase) return
    const desc = prompt('Descripción del premio:')
    if (!desc) return
    await supabase.from('premios').insert({ usuario_id: usuarioId, descripcion: desc })
    setMsg('✅ Premio asignado')
    await cargarTodo()
    setTimeout(() => setMsg(''), 3000)
  }

  const g = '#0d0d0d'
  const surface = '#1a1a1a'
  const border = '#2a2a2a'
  const gold = '#c9a84c'
  const muted = '#7a7570'
  const text = '#f0ede8'
  const green = '#52b38e'
  const red = '#ff7a47'

  const card: React.CSSProperties = { background: surface, border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden' }
  const th: React.CSSProperties = { padding: '10px 16px', fontSize: 11, color: muted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, borderBottom: `1px solid ${border}` }
  const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13, color: text, borderBottom: `1px solid #1e1e1e`, verticalAlign: 'middle' }

  const partidos_pendientes = partidos.filter(p => p.estado !== 'finalizado')
  const partidos_finalizados = partidos.filter(p => p.estado === 'finalizado')
  const jugadoresFiltrados = jugadores.filter(u =>
    !busqueda || `${u.nombre} ${u.apellido} ${u.telefono}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  // ── LOGIN ──
  if (!authed) return (
    <div style={{ background: g, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans), sans-serif' }}>
      <div style={{ ...card, padding: '36px 32px', width: '100%', maxWidth: 360 }}>
        <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 16 }}>🔐</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: text, textAlign: 'center' }}>Panel de Admin</div>
        <div style={{ fontSize: 12, color: muted, textAlign: 'center', marginTop: 4, marginBottom: 24 }}>Prode Mundial 2026 · La Cocina</div>
        {[{ label: 'Usuario', val: user, set: setUser, type: 'text', ph: 'admin' },
          { label: 'Contraseña', val: pass, set: setPass, type: 'password', ph: '••••••••' }].map(f => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</label>
            <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
              placeholder={f.ph} onKeyDown={e => e.key === 'Enter' && login()}
              style={{ background: '#222', border: `1px solid ${border}`, borderRadius: 10, padding: '11px 14px', color: text, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </div>
        ))}
        <button onClick={login} style={{ background: gold, color: '#1a1000', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: 'inherit', marginTop: 6 }}>
          Ingresar →
        </button>
      </div>
    </div>
  )

  // ── LAYOUT ──
  return (
    <div style={{ background: g, minHeight: '100vh', color: text, fontFamily: 'var(--font-sans), sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* TOPBAR */}
      <div style={{ background: '#0d0d0d', borderBottom: `1px solid ${border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, background: red, borderRadius: '50%' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: red, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin · Prode</div>
            <div style={{ fontSize: 10, color: muted }}>Mundial 2026 · La Cocina Ushuaia</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {msg && <div style={{ fontSize: 12, color: green, fontWeight: 600 }}>{msg}</div>}
          <div style={{ background: '#2a0a00', border: `1px solid #5a2010`, borderRadius: 6, padding: '4px 10px', fontSize: 11, color: red, fontWeight: 700 }}>🔴 Panel Privado</div>
          <button onClick={() => setAuthed(false)} style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: '6px 12px', color: muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Salir</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* SIDEBAR */}
        <div style={{ width: 200, background: '#111', borderRight: `1px solid ${border}`, padding: '20px 0', flexShrink: 0, position: 'sticky', top: 57, height: 'calc(100vh - 57px)' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', emoji: '▦' },
            { id: 'resultados', label: 'Resultados', emoji: '⚽' },
            { id: 'jugadores', label: 'Jugadores', emoji: '👥' },
            { id: 'premios', label: 'Premios', emoji: '🎁' },
            { id: 'notif', label: 'Notificaciones', emoji: '📣' },
          ].map(item => (
            <button key={item.id} onClick={() => setScreen(item.id as AdminScreen)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 13, fontWeight: 500, color: screen === item.id ? gold : muted, cursor: 'pointer', border: 'none', background: screen === item.id ? '#1a1500' : 'none', width: '100%', fontFamily: 'inherit', borderLeft: `3px solid ${screen === item.id ? gold : 'transparent'}`, textAlign: 'left', transition: 'all 0.15s' }}>
              <span>{item.emoji}</span>{item.label}
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
                  { label: 'Jugadores', num: jugadores.length, sub: 'registrados' },
                  { label: 'Partidos totales', num: partidos.length, sub: 'cargados' },
                  { label: 'Finalizados', num: partidos_finalizados.length, sub: 'con resultado' },
                  { label: 'Premios pendientes', num: premios.filter(p => !p.canjeado).length, sub: 'sin canjear' },
                ].map(s => (
                  <div key={s.label} style={{ ...card, padding: 16 }}>
                    <div style={{ fontSize: 11, color: muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: gold, marginTop: 6, lineHeight: 1 }}>{s.num}</div>
                    <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Top 5 Ranking</div>
              <div style={card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['#', 'Jugador', 'Exactos', 'Tendencias', 'Total'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {ranking.slice(0, 5).map((r, i) => (
                      <tr key={r.id}>
                        <td style={td}><span style={{ fontWeight: 800, color: ['#FFD700','#C0C0C0','#CD7F32'][i] || muted }}>{i+1}</span></td>
                        <td style={td}><div style={{ fontWeight: 600 }}>{r.nombre} {r.apellido}</div><div style={{ fontSize: 11, color: muted }}>{r.telefono}</div></td>
                        <td style={td}>{r.exactos}</td>
                        <td style={td}>{r.tendencias}</td>
                        <td style={{ ...td, fontWeight: 800, color: gold }}>{r.total} pts</td>
                      </tr>
                    ))}
                    {ranking.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: muted }}>No hay puntajes todavía</td></tr>}
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

              {partidos_pendientes.filter(p => p.estado === 'en_juego' || p.estado === 'abierto').length > 0 && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Partidos activos</div>
                  <div style={{ ...card, marginBottom: 20 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>{['Partido', 'Grupo', 'Estado', 'En vivo', 'Resultado', 'Acción'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {partidos.filter(p => p.estado !== 'finalizado').map(p => (
                          <tr key={p.id}>
                            <td style={td}>
                              <div style={{ fontWeight: 600 }}>{p.equipo_local}</div>
                              <div style={{ fontSize: 11, color: muted }}>vs {p.equipo_visitante}</div>
                              <div style={{ fontSize: 11, color: muted }}>{new Date(p.fecha_hora).toLocaleDateString('es-AR')} · {new Date(p.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs</div>
                            </td>
                            <td style={td}><span style={{ background: '#1e1e1e', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: muted }}>Grupo {p.grupo}</span></td>
                            <td style={td}>
                              <span style={{ background: p.en_vivo ? '#0a2a1a' : '#1e1e1e', color: p.en_vivo ? green : muted, border: `1px solid ${p.en_vivo ? '#1a5a38' : border}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                                {p.en_vivo ? '🔴 En vivo' : p.estado}
                              </span>
                            </td>
                            <td style={td}>
                              <button onClick={() => toggleEnVivo(p)}
                                style={{ background: p.en_vivo ? '#2a0a00' : '#0a2a1a', color: p.en_vivo ? red : green, border: `1px solid ${p.en_vivo ? '#5a2010' : '#1a5a38'}`, borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                {p.en_vivo ? 'Desactivar' : 'Activar'}
                              </button>
                            </td>
                            <td style={td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input type="number" min={0} max={20} placeholder="0"
                                  value={resultadoEdit[p.id]?.l || ''}
                                  onChange={e => setResultadoEdit(prev => ({ ...prev, [p.id]: { ...prev[p.id], l: e.target.value } }))}
                                  style={{ width: 44, background: '#222', border: `1px solid ${border}`, borderRadius: 8, padding: '6px', color: text, fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
                                <span style={{ color: muted, fontWeight: 700 }}>-</span>
                                <input type="number" min={0} max={20} placeholder="0"
                                  value={resultadoEdit[p.id]?.v || ''}
                                  onChange={e => setResultadoEdit(prev => ({ ...prev, [p.id]: { ...prev[p.id], v: e.target.value } }))}
                                  style={{ width: 44, background: '#222', border: `1px solid ${border}`, borderRadius: 8, padding: '6px', color: text, fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
                              </div>
                            </td>
                            <td style={td}>
                              <button onClick={() => confirmarResultado(p)} disabled={loading}
                                style={{ background: '#3a8f6e', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Confirmar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {partidos_finalizados.length > 0 && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Finalizados</div>
                  <div style={card}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>{['Partido', 'Fecha', 'Resultado'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {partidos_finalizados.map(p => (
                          <tr key={p.id}>
                            <td style={td}><div style={{ fontWeight: 600 }}>{p.equipo_local} vs {p.equipo_visitante}</div><div style={{ fontSize: 11, color: muted }}>Grupo {p.grupo}</div></td>
                            <td style={{ ...td, color: muted, fontSize: 12 }}>{new Date(p.fecha_hora).toLocaleDateString('es-AR')}</td>
                            <td style={{ ...td, fontWeight: 800, color: green }}>{p.goles_local} - {p.goles_visitante}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── JUGADORES ── */}
          {screen === 'jugadores' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Jugadores registrados</div>
              <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>{jugadores.length} jugadores activos</div>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o WhatsApp..."
                style={{ width: '100%', background: surface, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 16px', color: text, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginBottom: 16 }} />
              <div style={card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Jugador', 'WhatsApp', 'Registro', 'Puntaje', 'Premio'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {jugadoresFiltrados.map(u => {
                      const rank = ranking.find(r => r.id === u.id)
                      return (
                        <tr key={u.id}>
                          <td style={td}><div style={{ fontWeight: 600 }}>{u.nombre} {u.apellido}</div></td>
                          <td style={{ ...td, color: muted }}>{u.telefono}</td>
                          <td style={{ ...td, color: muted, fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                          <td style={{ ...td, fontWeight: 800, color: gold }}>{rank?.total || 0} pts</td>
                          <td style={td}>
                            <button onClick={() => asignarPremio(u.id)}
                              style={{ background: '#1a1500', color: gold, border: `1px solid #3a2a00`, borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              + Asignar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {jugadoresFiltrados.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: muted }}>No hay jugadores</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PREMIOS ── */}
          {screen === 'premios' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Premios</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total entregados', num: premios.length, color: gold },
                  { label: 'Sin canjear', num: premios.filter(p => !p.canjeado).length, color: red },
                  { label: 'Canjeados', num: premios.filter(p => p.canjeado).length, color: green },
                ].map(s => (
                  <div key={s.label} style={{ ...card, padding: 16 }}>
                    <div style={{ fontSize: 11, color: muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 6 }}>{s.num}</div>
                  </div>
                ))}
              </div>
              <div style={card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Jugador', 'Premio', 'Fecha', 'Estado', 'Acción'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {premios.map(pr => (
                      <tr key={pr.id}>
                        <td style={td}><div style={{ fontWeight: 600 }}>{pr.usuarios?.nombre} {pr.usuarios?.apellido}</div><div style={{ fontSize: 11, color: muted }}>{pr.usuarios?.telefono}</div></td>
                        <td style={td}>{pr.descripcion}</td>
                        <td style={{ ...td, color: muted, fontSize: 12 }}>{new Date(pr.created_at).toLocaleDateString('es-AR')}</td>
                        <td style={td}>
                          <span style={{ background: pr.canjeado ? '#1a1500' : '#2a0a00', color: pr.canjeado ? gold : red, border: `1px solid ${pr.canjeado ? '#3a2a00' : '#5a2010'}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                            {pr.canjeado ? 'Canjeado' : 'Pendiente'}
                          </span>
                        </td>
                        <td style={td}>
                          {!pr.canjeado && (
                            <button onClick={() => marcarCanjeado(pr.id)}
                              style={{ background: '#0a2a1a', color: green, border: `1px solid #1a5a38`, borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Marcar canjeado
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {premios.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: muted }}>No hay premios asignados</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── NOTIFICACIONES ── */}
          {screen === 'notif' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Notificaciones</div>
              {[
                {
                  title: '⏰ Recordatorio de fecha',
                  sub: 'Avisá a todos que la fecha está por cerrar',
                  msg: `🏆 Prode La Cocina · Mundial 2026\n\n¡Che! Faltan 2 horas para que cierre la fecha.\n¿Ya cargaste tus pronósticos? No te quedes afuera 👀\n\n👉 lacocinaushuaia.com.ar/prode`,
                  btn1: { label: `Enviar a todos (${jugadores.length})`, action: () => { setMsg(`✅ Enviado a ${jugadores.length} jugadores`); setTimeout(() => setMsg(''), 3000) } },
                },
                {
                  title: '🎁 Anuncio de ganador',
                  sub: 'Avisá al ganador que tiene un premio',
                  msg: `🏆 Prode La Cocina · Mundial 2026\n\n¡${ranking[0]?.nombre || 'Jugador'}, ganaste esta fecha! 🎉\nTu premio está esperándote.\n\nAvisanos por WhatsApp para canjearlo 👇`,
                  btn1: { label: 'Enviar al ganador', action: () => { setMsg(`✅ Enviado a ${ranking[0]?.nombre || 'ganador'}`); setTimeout(() => setMsg(''), 3000) } },
                },
              ].map(n => (
                <div key={n.title} style={{ ...card, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: muted, marginBottom: 14 }}>{n.sub}</div>
                  <div style={{ background: '#222', border: `1px solid ${border}`, borderRadius: 10, padding: 14, fontSize: 13, lineHeight: 1.6, color: text, marginBottom: 14, whiteSpace: 'pre-line' }}>
                    {n.msg}
                  </div>
                  <button onClick={n.btn1.action}
                    style={{ background: gold, color: '#1a1000', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {n.btn1.label}
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}