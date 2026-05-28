'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Screen = 'login' | 'jugar' | 'ranking'

interface Usuario {
  id: string
  nombre: string
  apellido: string
  telefono: string
}

interface Partido {
  id: string
  equipo_local: string
  equipo_visitante: string
  fecha_hora: string
  goles_local: number | null
  goles_visitante: number | null
  minuto: number | null
  en_vivo: boolean
  estado: string
  grupo: string
  fase: string
}

interface Pronostico {
  partido_id: string
  goles_local: number
  goles_visitante: number
}

interface RankingItem {
  id: string
  nombre: string
  apellido: string
  total: number
  exactos: number
  tendencias: number
}

export default function ProdePage() {
  const [screen, setScreen] = useState<Screen>('login')
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [pronosticos, setPronosticos] = useState<Record<string, Pronostico>>({})
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [puntaje, setPuntaje] = useState(0)
  const [loading, setLoading] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>([])

  // Form login
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')

  useEffect(() => {
    // Restaurar sesión del localStorage
    const saved = localStorage.getItem('prode_usuario')
    if (saved) {
      const u = JSON.parse(saved)
      setUsuario(u)
      setScreen('jugar')
      cargarDatos(u.id)
    }
  }, [])

  // Polling para resultados en vivo cada 60 segundos
  useEffect(() => {
    if (screen === 'jugar' || screen === 'ranking') {
      cargarPartidos()
      const interval = setInterval(cargarPartidos, 60000)
      return () => clearInterval(interval)
    }
  }, [screen])

  async function cargarPartidos() {
    const { data } = await supabase
      .from('partidos')
      .select('*')
      .in('estado', ['pendiente', 'abierto', 'en_juego', 'finalizado'])
      .order('fecha_hora', { ascending: true })
    if (data) setPartidos(data)
  }

  async function cargarDatos(userId: string) {
    // Partidos
    await cargarPartidos()

    // Pronósticos del usuario
    const { data: prono } = await supabase
      .from('pronosticos')
      .select('*')
      .eq('usuario_id', userId)

    if (prono) {
      const map: Record<string, Pronostico> = {}
      prono.forEach(p => { map[p.partido_id] = p })
      setPronosticos(map)
      setSavedIds(prono.map(p => p.partido_id))
    }

    // Puntaje del usuario
    const { data: pts } = await supabase
      .from('puntos')
      .select('puntos')
      .eq('usuario_id', userId)

    if (pts) {
      setPuntaje(pts.reduce((acc, p) => acc + p.puntos, 0))
    }

    // Ranking
    const { data: rank } = await supabase
      .from('ranking')
      .select('*')
      .limit(20)

    if (rank) setRanking(rank)
  }

  async function registrar() {
    if (!nombre.trim() || !apellido.trim() || !telefono.trim()) {
      alert('Completá todos los campos')
      return
    }
    setLoading(true)

    // Buscar si ya existe
    const { data: existente } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefono', telefono.trim())
      .single()

    if (existente) {
      setUsuario(existente)
      localStorage.setItem('prode_usuario', JSON.stringify(existente))
      await cargarDatos(existente.id)
      setScreen('jugar')
      setLoading(false)
      return
    }

    // Crear nuevo usuario
    const { data, error } = await supabase
      .from('usuarios')
      .insert({ nombre: nombre.trim(), apellido: apellido.trim(), telefono: telefono.trim() })
      .select()
      .single()

    setLoading(false)
    if (error) { alert('Error al registrarte. Intentá de nuevo.'); return }

    setUsuario(data)
    localStorage.setItem('prode_usuario', JSON.stringify(data))
    await cargarDatos(data.id)
    setScreen('jugar')
  }

  async function guardarPronostico(partidoId: string, local: number, visitante: number) {
    if (!usuario) return

    const { error } = await supabase
      .from('pronosticos')
      .upsert({
        usuario_id: usuario.id,
        partido_id: partidoId,
        goles_local: local,
        goles_visitante: visitante
      }, { onConflict: 'usuario_id,partido_id' })

    if (!error) {
      setSavedIds(prev => [...new Set([...prev, partidoId])])
      setPronosticos(prev => ({ ...prev, [partidoId]: { partido_id: partidoId, goles_local: local, goles_visitante: visitante } }))
    }
  }

  function estaAbierto(partido: Partido) {
    if (partido.estado !== 'abierto') return false
    return new Date() < new Date(partido.fecha_hora)
  }

  function formatFecha(fechaHora: string) {
    const d = new Date(fechaHora)
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' }) +
      ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + 'hs'
  }

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', color: '#f0ede8', fontFamily: 'var(--font-sans), sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* TOPBAR */}
        <div style={{ background: '#0d0d0d', borderBottom: '1px solid #2a2a2a', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, background: '#c9a84c', borderRadius: '50%' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c9a84c', letterSpacing: '0.08em', textTransform: 'uppercase' }}>La Cocina · Prode</div>
              <div style={{ fontSize: 10, color: '#7a7570' }}>Mundial 2026</div>
            </div>
          </div>
          {usuario && (
            <div style={{ fontSize: 12, color: '#7a7570' }}>Hola, {usuario.nombre} 👋</div>
          )}
        </div>

        {/* ── LOGIN ── */}
        {screen === 'login' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 90 }}>
            <div style={{ background: 'linear-gradient(180deg, #1a1000 0%, #0d0d0d 100%)', padding: '40px 24px 32px', textAlign: 'center', borderBottom: '1px solid #2a2a2a' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🏆</div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Prode Mundial 2026</h1>
              <p style={{ fontSize: 13, color: '#7a7570', marginTop: 6, lineHeight: 1.5 }}>Pronosticá los partidos, acumulá puntos<br />y ganá premios reales en La Cocina</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                {['🍔 Combos gratis', '🛵 Envíos sin cargo', '🎁 Descuentos'].map(p => (
                  <div key={p} style={{ background: '#1a1500', border: '1px solid #3a2a00', borderRadius: 20, padding: '5px 12px', fontSize: 11, color: '#e8c97a', fontWeight: 600 }}>{p}</div>
                ))}
              </div>
            </div>

            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 11, color: '#7a7570', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Crear cuenta gratis</div>
              {[
                { label: 'Nombre', value: nombre, set: setNombre, placeholder: 'Ej: Martín' },
                { label: 'Apellido', value: apellido, set: setApellido, placeholder: 'Ej: García' },
                { label: 'WhatsApp', value: telefono, set: setTelefono, placeholder: '+54 9 2901 123456' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: '#7a7570', fontWeight: 500 }}>{f.label}</label>
                  <input
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '12px 16px', color: '#f0ede8', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              ))}
              <button
                onClick={registrar}
                disabled={loading}
                style={{ background: loading ? '#888' : '#c9a84c', color: '#1a1000', border: 'none', borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                {loading ? 'Entrando...' : 'Entrar al Prode →'}
              </button>
              <p style={{ fontSize: 11, color: '#7a7570', textAlign: 'center' }}>Si ya te registraste, usá el mismo WhatsApp para entrar.</p>
            </div>
          </div>
        )}

        {/* ── JUGAR ── */}
        {screen === 'jugar' && (
          <div style={{ flex: 1, flexDirection: 'column', display: 'flex', paddingBottom: 90 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a2a' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0a1f0f', border: '1px solid #1a4a28', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#52b38e', fontWeight: 600 }}>
                <div style={{ width: 6, height: 6, background: '#52b38e', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                Fase de Grupos · Mundial 2026
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 10 }}>Cargá tus pronósticos</div>
              <div style={{ fontSize: 12, color: '#7a7570', marginTop: 3 }}>Se bloquean automáticamente antes de cada partido</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '8px 12px', marginTop: 12 }}>
                <div style={{ fontSize: 11, color: '#7a7570', flex: 1 }}>Tu puntaje acumulado</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#c9a84c' }}>{puntaje} pts</div>
              </div>
            </div>

            <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {partidos.length === 0 && (
                <div style={{ textAlign: 'center', color: '#7a7570', padding: 32, fontSize: 13 }}>No hay partidos disponibles todavía.</div>
              )}
              {partidos.map(p => {
                const abierto = estaAbierto(p)
                const enVivo = p.en_vivo
                const prono = pronosticos[p.id]
                const guardado = savedIds.includes(p.id)

                return (
                  <PartidoCard
                    key={p.id}
                    partido={p}
                    abierto={abierto}
                    enVivo={enVivo}
                    pronostico={prono}
                    guardado={guardado}
                    formatFecha={formatFecha}
                    onGuardar={(local, visitante) => guardarPronostico(p.id, local, visitante)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* ── RANKING ── */}
        {screen === 'ranking' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 90 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a2a' }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Tabla de posiciones</div>
              <div style={{ fontSize: 12, color: '#7a7570', marginTop: 3 }}>Mundial 2026 · En tiempo real</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '14px 20px 0' }}>
              {[
                { label: 'Jugadores', num: ranking.length },
                { label: 'Tu posición', num: ranking.findIndex(r => r.id === usuario?.id) + 1 || '—' },
              ].map(s => (
                <div key={s.label} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#c9a84c' }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: '#7a7570', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ranking.map((r, i) => {
                const esVos = r.id === usuario?.id
                const medallas = ['🥇', '🥈', '🥉']
                return (
                  <div key={r.id} style={{ background: '#1a1a1a', border: `1px solid ${esVos ? '#c9a84c' : '#2a2a2a'}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, minWidth: 28, textAlign: 'center', color: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : '#7a7570' }}>
                      {i < 3 ? medallas[i] : i + 1}
                    </div>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: esVos ? '#1a1500' : '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: esVos ? '#c9a84c' : '#7a7570', flexShrink: 0 }}>
                      {r.nombre[0]}{r.apellido[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {r.nombre} {r.apellido[0]}.
                        {esVos && <span style={{ fontSize: 9, background: '#c9a84c', color: '#1a1000', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>Vos</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#7a7570', marginTop: 2 }}>{r.exactos} exactos · {r.tendencias} tendencias</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#c9a84c', lineHeight: 1 }}>{r.total}</div>
                      <div style={{ fontSize: 10, color: '#7a7570', marginTop: 2 }}>pts</div>
                    </div>
                  </div>
                )
              })}
              {ranking.length === 0 && (
                <div style={{ textAlign: 'center', color: '#7a7570', padding: 32, fontSize: 13 }}>Todavía no hay puntajes cargados.</div>
              )}
            </div>
          </div>
        )}

        {/* BOTTOM NAV */}
        {screen !== 'login' && (
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: '#0d0d0d', borderTop: '1px solid #2a2a2a', display: 'flex', padding: '8px 0 20px', zIndex: 10 }}>
            {([
              { id: 'jugar', label: 'Jugar', icon: '⏱' },
              { id: 'ranking', label: 'Ranking', icon: '📊' },
            ] as const).map(n => (
              <button
                key={n.id}
                onClick={() => { setScreen(n.id); if (usuario) cargarDatos(usuario.id) }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <span style={{ fontSize: 20 }}>{n.icon}</span>
                <span style={{ fontSize: 10, color: screen === n.id ? '#c9a84c' : '#7a7570', fontWeight: 600 }}>{n.label}</span>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

// ── COMPONENTE PARTIDO ──
function PartidoCard({ partido, abierto, enVivo, pronostico, guardado, formatFecha, onGuardar }: {
  partido: Partido
  abierto: boolean
  enVivo: boolean
  pronostico: Pronostico | undefined
  guardado: boolean
  formatFecha: (f: string) => string
  onGuardar: (l: number, v: number) => void
}) {
  const [local, setLocal] = useState(pronostico?.goles_local ?? '')
  const [visitante, setVisitante] = useState(pronostico?.goles_visitante ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(guardado)

  async function handleGuardar() {
    if (local === '' || visitante === '') { alert('Completá los dos marcadores'); return }
    setSaving(true)
    await onGuardar(Number(local), Number(visitante))
    setSaving(false)
    setSaved(true)
  }

  return (
    <div style={{ background: '#1a1a1a', border: `1px solid ${saved ? '#1a4a28' : '#2a2a2a'}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: '#7a7570', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Grupo {partido.grupo} · {formatFecha(partido.fecha_hora)}
        </div>
        {enVivo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#e05c2a', fontWeight: 700 }}>
            <div style={{ width: 6, height: 6, background: '#e05c2a', borderRadius: '50%' }} />
            EN VIVO {partido.minuto ? `${partido.minuto}'` : ''}
          </div>
        ) : abierto ? (
          <div style={{ fontSize: 10, color: '#52b38e', fontWeight: 600 }}>🔓 Abierto</div>
        ) : (
          <div style={{ fontSize: 10, color: '#e05c2a', fontWeight: 600 }}>🔒 Cerrado</div>
        )}
      </div>

      <div style={{ padding: '16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 28 }}>{partido.equipo_local.split(' ')[0]}</div>
            <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' }}>{partido.equipo_local.split(' ').slice(1).join(' ')}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 8px' }}>
            {enVivo && partido.goles_local !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#e05c2a' }}>{partido.goles_local}</div>
                <span style={{ fontSize: 20, color: '#7a7570', fontWeight: 700 }}>-</span>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#e05c2a' }}>{partido.goles_visitante}</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, color: '#7a7570', fontWeight: 500 }}>Tu pronóstico</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number" min={0} max={20}
                    value={local}
                    onChange={e => setLocal(e.target.value)}
                    disabled={!abierto}
                    placeholder="-"
                    style={{ width: 40, height: 40, background: '#111', border: `1px solid ${abierto ? '#3a3a3a' : '#222'}`, borderRadius: 10, color: '#f0ede8', fontSize: 18, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit', opacity: abierto ? 1 : 0.5 }}
                  />
                  <span style={{ fontSize: 18, color: '#7a7570', fontWeight: 700 }}>-</span>
                  <input
                    type="number" min={0} max={20}
                    value={visitante}
                    onChange={e => setVisitante(e.target.value)}
                    disabled={!abierto}
                    placeholder="-"
                    style={{ width: 40, height: 40, background: '#111', border: `1px solid ${abierto ? '#3a3a3a' : '#222'}`, borderRadius: 10, color: '#f0ede8', fontSize: 18, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit', opacity: abierto ? 1 : 0.5 }}
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 28 }}>{partido.equipo_visitante.split(' ')[0]}</div>
            <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' }}>{partido.equipo_visitante.split(' ').slice(1).join(' ')}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {saved ? (
          <div style={{ fontSize: 11, color: '#52b38e', fontWeight: 600 }}>✓ Guardado</div>
        ) : <div />}
        {abierto && (
          <button
            onClick={handleGuardar}
            disabled={saving}
            style={{ background: '#c9a84c', color: '#1a1000', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {saving ? 'Guardando...' : saved ? 'Actualizar' : 'Guardar'}
          </button>
        )}
      </div>
    </div>
  )
}