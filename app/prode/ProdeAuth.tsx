'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Usuario { id: string; nombre: string; apellido: string; telefono: string }
interface ProdeAuthProps { onSuccess: (usuario: Usuario) => void }

export default function ProdeAuth({ onSuccess }: ProdeAuthProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telLogin, setTelLogin] = useState('')
  const [telRegister, setTelRegister] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorLogin, setErrorLogin] = useState('')
  const [errorRegister, setErrorRegister] = useState('')

  async function login() {
    if (!telLogin.trim()) { setErrorLogin('Ingresá tu WhatsApp'); return }
    setLoading(true); setErrorLogin('')
    const { data } = await supabase.from('usuarios').select('*').eq('telefono', telLogin.trim()).single()
    setLoading(false)
    if (!data) { setErrorLogin('No encontramos esa cuenta'); return }
    onSuccess(data)
  }

  async function registrar() {
    if (!nombre.trim() || !apellido.trim() || !telRegister.trim()) {
      setErrorRegister('Completá todos los campos'); return
    }
    setLoading(true); setErrorRegister('')
    const { data: existente } = await supabase.from('usuarios').select('*').eq('telefono', telRegister.trim()).single()
    if (existente) { onSuccess(existente); setLoading(false); return }
    const { data, error } = await supabase
      .from('usuarios')
      .insert({ nombre: nombre.trim(), apellido: apellido.trim(), telefono: telRegister.trim() })
      .select().single()
    setLoading(false)
    if (error) { setErrorRegister('Error al crear cuenta'); return }
    onSuccess(data)
  }

  const inp: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '8px 10px',
    color: '#fff',
    fontSize: '0.72rem',
    outline: 'none',
    fontFamily: 'inherit',
    marginTop: 3,
  }

  return (
    <div style={{
      width: '100vw',
      minHeight: '100dvh',
      background: '#080808',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans), sans-serif',
      padding: '20px',
    }}>

      {/* Contenedor principal — overflow:hidden para que el overlay quede contenido */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 720,
        height: 500,
        borderRadius: 24,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        overflow: 'hidden',
        display: 'flex',
        background: '#111',
        flexShrink: 0,
      }}>

        {/* ── LOGIN (izquierda 50%) ── */}
        <div style={{
          width: '50%', height: '100%', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '36px 28px', gap: 16,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Bienvenido</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Ingresá con tu WhatsApp</div>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>WhatsApp</label>
            <input type="tel" value={telLogin} onChange={e => setTelLogin(e.target.value)} placeholder="+54 9 2901..." onKeyDown={e => e.key === 'Enter' && login()} style={inp} />
            {errorLogin && <div style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: 2 }}>{errorLogin}</div>}
          </div>
          <button onClick={login} disabled={loading} style={{
            width: '100%', background: 'linear-gradient(135deg, #d4a84c, #c9a84c)',
            color: '#1a1000', border: 'none', borderRadius: 8, padding: '9px',
            fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Buscando...' : 'Ingresar →'}
          </button>
        </div>

        {/* ── REGISTRO (derecha 50%) ── */}
        <div style={{
          width: '50%', height: '100%', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '36px 28px', gap: 14,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Crear cuenta</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Registrate gratis para jugar</div>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nombre</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Martín" style={inp} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Apellido</label>
                <input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="García" style={inp} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>WhatsApp</label>
              <input type="tel" value={telRegister} onChange={e => setTelRegister(e.target.value)} placeholder="+54 9 2901 123456" onKeyDown={e => e.key === 'Enter' && registrar()} style={inp} />
            </div>
            {errorRegister && <div style={{ fontSize: '0.65rem', color: '#ef4444' }}>{errorRegister}</div>}
          </div>
          <button onClick={registrar} disabled={loading} style={{
            width: '100%', background: 'linear-gradient(135deg, #d4a84c, #c9a84c)',
            color: '#1a1000', border: 'none', borderRadius: 8, padding: '9px',
            fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Creando...' : 'Crear cuenta →'}
          </button>
        </div>

        {/* ── OVERLAY DESLIZANTE (50% ancho, z-index alto) ── */}
        <motion.div
          animate={{ x: isSignUp ? '100%' : '0%' }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '50%', height: '100%', zIndex: 10,
            background: 'linear-gradient(160deg, #1c1200 0%, #0d0d0d 50%, #1a1000 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, padding: '32px 20px',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,168,76,0.1) 0%, transparent 70%)' }} />

          <div style={{ position: 'relative', width: 44, height: 44 }}>
            <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.2) 0%, transparent 70%)' }} />
            <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
              <img src="https://www.lacocinaushuaia.com.ar/logo-blanco.svg" alt="La Cocina" style={{ width: '100%', objectFit: 'contain' }} />
            </div>
          </div>

          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{ fontSize: '0.55rem', color: '#c9a84c', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
              Prode Mundial 2026
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              {isSignUp ? 'Ya tenés\ncuenta?' : '¿Primera\nvez?'}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>
              {isSignUp
                ? 'Ingresá con tu WhatsApp\ny seguí acumulando puntos'
                : 'Registrate gratis y ganá\npremios reales en La Cocina'}
            </div>
          </div>

          <div style={{ width: 28, height: 1, background: 'rgba(201,168,76,0.3)' }} />

          <button
            onClick={() => { setIsSignUp(p => !p); setNombre(''); setApellido(''); setTelLogin(''); setTelRegister(''); }}
            style={{
              position: 'relative', background: 'transparent', color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8,
              padding: '8px 20px', fontSize: '0.74rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {isSignUp ? 'Iniciar sesión' : 'Registrarme'}
          </button>
        </motion.div>

      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(201,168,76,0.4) !important; }
      `}</style>
    </div>
  )
}