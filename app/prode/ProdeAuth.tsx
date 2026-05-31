'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type AuthScreen = 'landing' | 'registro' | 'login'

interface Usuario {
  id: string
  nombre: string
  apellido: string
  telefono: string
}

interface ProdeAuthProps {
  onSuccess: (usuario: Usuario) => void
}

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.38, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-100%' : '100%',
    opacity: 0,
    transition: { duration: 0.3, ease: [0.77, 0, 0.175, 1] as [number, number, number, number] },
  }),
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] } },
}

export default function ProdeAuth({ onSuccess }: ProdeAuthProps) {
  const [screen, setScreen] = useState<AuthScreen>('landing')
  const [direction, setDirection] = useState(1)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function goTo(next: AuthScreen, dir: number) {
    setError('')
    setDirection(dir)
    setScreen(next)
  }

  async function registrar() {
    if (!nombre.trim() || !apellido.trim() || !telefono.trim()) {
      setError('Completá todos los campos')
      return
    }
    setLoading(true)
    setError('')
    const { data: existente } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefono', telefono.trim())
      .single()

    if (existente) {
      onSuccess(existente)
      setLoading(false)
      return
    }

    const { data, error: err } = await supabase
      .from('usuarios')
      .insert({ nombre: nombre.trim(), apellido: apellido.trim(), telefono: telefono.trim() })
      .select()
      .single()

    setLoading(false)
    if (err) { setError('Error al crear la cuenta. Intentá de nuevo.'); return }
    onSuccess(data)
  }

  async function login() {
    if (!telefono.trim()) { setError('Ingresá tu WhatsApp'); return }
    setLoading(true)
    setError('')
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefono', telefono.trim())
      .single()

    setLoading(false)
    if (!data) { setError('No encontramos esa cuenta. ¿Ya te registraste?'); return }
    onSuccess(data)
  }

  const s = {
    wrap: {
      position: 'relative' as const,
      overflow: 'hidden',
      width: '100%',
      minHeight: '100dvh',
    },
    screen: {
      position: 'absolute' as const,
      inset: 0,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
    },
  }

  return (
    <div style={{ background: '#080808', minHeight: '100dvh', fontFamily: 'var(--font-sans), sans-serif', overflow: 'hidden' }}>
      <div style={s.wrap}>
        <AnimatePresence custom={direction} mode="popLayout">

          {/* ── LANDING ── */}
          {screen === 'landing' && (
            <motion.div
              key="landing"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ ...s.screen, justifyContent: 'center', padding: '40px 24px' }}
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}
              >
                {/* Logo */}
                <motion.div variants={itemVariants} style={{ marginBottom: 20 }}>
                  <div style={{ position: 'relative', width: 80, height: 80 }}>
                    <div style={{
                      position: 'absolute', inset: -14, borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(201,168,76,0.2) 0%, transparent 70%)',
                      animation: 'pulseGlow 3s ease-in-out infinite'
                    }} />
                    <div style={{
                      position: 'relative', width: 80, height: 80, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
                      boxShadow: '0 0 0 1px rgba(201,168,76,0.08), 0 20px 40px rgba(0,0,0,0.5)'
                    }}>
                      <img src="https://www.lacocinaushuaia.com.ar/logo-blanco.svg" alt="La Cocina" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>
                </motion.div>

                {/* Texto */}
                <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.65rem', color: '#c9a84c', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
                    La Cocina Ushuaia
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
                    Prode<br />Mundial 2026
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: 32 }}>
                  <p style={{ fontSize: '0.88rem', color: '#6b6560', lineHeight: 1.6 }}>
                    Pronosticá, acumulá puntos<br />y ganá premios reales
                  </p>
                </motion.div>

                {/* Premios */}
                <motion.div variants={itemVariants} style={{ display: 'flex', gap: 6, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['🛵 Envío gratis', '🍔 Combos', '🎁 Descuentos'].map(p => (
                    <div key={p} style={{
                      background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)',
                      borderRadius: 20, padding: '5px 12px', fontSize: '0.72rem', color: '#c9a84c', fontWeight: 600
                    }}>{p}</div>
                  ))}
                </motion.div>

                {/* Botones */}
                <motion.div variants={itemVariants} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => goTo('registro', 1)}
                    style={{
                      background: 'linear-gradient(135deg, #d4a84c, #c9a84c, #b8922e)',
                      color: '#1a1000', border: 'none', borderRadius: 14, padding: 16,
                      fontSize: '1rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 4px 20px rgba(201,168,76,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                      transition: 'transform 160ms ease, filter 160ms ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
                    onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
                    onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                    onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    Quiero jugar →
                  </button>
                  <button
                    onClick={() => { setTelefono(''); goTo('login', 1) }}
                    style={{
                      background: 'rgba(255,255,255,0.04)', color: '#8a8278',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16,
                      fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'color 160ms ease, border-color 160ms ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#8a8278'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                  >
                    Ya tengo cuenta
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* ── REGISTRO ── */}
          {screen === 'registro' && (
            <motion.div
              key="registro"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ ...s.screen, padding: 0 }}
            >
              {/* Header */}
              <div style={{
                width: '100%', background: '#080808',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
                position: 'sticky', top: 0, zIndex: 10,
              }}>
                <button
                  onClick={() => goTo('landing', -1)}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: 0, display: 'flex', opacity: 0.7 }}
                >
                  ←
                </button>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Crear cuenta</div>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                style={{ width: '100%', maxWidth: 420, padding: '28px 20px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <motion.div variants={itemVariants}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>¡Bienvenido! 🏆</div>
                  <div style={{ fontSize: '0.82rem', color: '#6b6560', marginTop: 4 }}>Completá tus datos para empezar gratis</div>
                </motion.div>

                <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: '0.72rem', color: '#6b6560', fontWeight: 600 }}>Nombre</label>
                  <input
                    value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Martín"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
                  />
                </motion.div>

                <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: '0.72rem', color: '#6b6560', fontWeight: 600 }}>Apellido</label>
                  <input
                    value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Ej: García"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
                  />
                </motion.div>

                <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: '0.72rem', color: '#6b6560', fontWeight: 600 }}>WhatsApp (para recibir tus premios)</label>
                  <input
                    type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+54 9 2901 123456"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
                  />
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#ef4444' }}
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div variants={itemVariants} style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: '10px 14px', fontSize: '0.75rem', color: '#60a5fa', lineHeight: 1.5 }}>
                  📱 Tu WhatsApp es tu clave de acceso. Guardalo para volver a entrar.
                </motion.div>

                <motion.div variants={itemVariants}>
                  <button
                    onClick={registrar} disabled={loading}
                    style={{
                      background: loading ? 'rgba(201,168,76,0.5)' : '#c9a84c',
                      color: '#1a1000', border: 'none', borderRadius: 14, padding: 15,
                      fontSize: '0.95rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                      width: '100%', fontFamily: 'inherit',
                      boxShadow: '0 4px 20px rgba(201,168,76,0.2)',
                      transition: 'background 200ms ease',
                    }}
                  >
                    {loading ? 'Creando cuenta...' : 'Crear cuenta y jugar →'}
                  </button>
                </motion.div>

                <motion.div variants={itemVariants} style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6b6560' }}>
                  ¿Ya tenés cuenta?{' '}
                  <span
                    onClick={() => { setTelefono(''); goTo('login', 1) }}
                    style={{ color: '#fff', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Ingresá acá
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* ── LOGIN ── */}
          {screen === 'login' && (
            <motion.div
              key="login"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ ...s.screen, padding: 0 }}
            >
              {/* Header */}
              <div style={{
                width: '100%', background: '#080808',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
                position: 'sticky', top: 0, zIndex: 10,
              }}>
                <button
                  onClick={() => goTo('landing', -1)}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: 0, opacity: 0.7 }}
                >
                  ←
                </button>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Ingresar</div>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                style={{ width: '100%', maxWidth: 420, padding: '28px 20px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <motion.div variants={itemVariants}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Bienvenido de vuelta 👋</div>
                  <div style={{ fontSize: '0.82rem', color: '#6b6560', marginTop: 4 }}>Ingresá con tu número de WhatsApp</div>
                </motion.div>

                <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: '0.72rem', color: '#6b6560', fontWeight: 600 }}>Tu WhatsApp</label>
                  <input
                    type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                    placeholder="+54 9 2901 123456"
                    onKeyDown={e => e.key === 'Enter' && login()}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
                  />
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#ef4444' }}
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div variants={itemVariants}>
                  <button
                    onClick={login} disabled={loading}
                    style={{
                      background: loading ? 'rgba(201,168,76,0.5)' : '#c9a84c',
                      color: '#1a1000', border: 'none', borderRadius: 14, padding: 15,
                      fontSize: '0.95rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                      width: '100%', fontFamily: 'inherit',
                      boxShadow: '0 4px 20px rgba(201,168,76,0.2)',
                      transition: 'background 200ms ease',
                    }}
                  >
                    {loading ? 'Buscando cuenta...' : 'Ingresar →'}
                  </button>
                </motion.div>

                <motion.div variants={itemVariants} style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6b6560' }}>
                  ¿No tenés cuenta?{' '}
                  <span
                    onClick={() => { setNombre(''); setApellido(''); setTelefono(''); goTo('registro', -1) }}
                    style={{ color: '#fff', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Registrate gratis
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        input::placeholder { color: rgba(255,255,255,0.15); }
        input:focus { border-color: rgba(201,168,76,0.4) !important; }
      `}</style>
    </div>
  )
}