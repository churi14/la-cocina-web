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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '10px 12px',
    color: '#fff',
    fontSize: '0.78rem',
    outline: 'none',
    fontFamily: 'inherit',
    marginTop: 4,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    display: 'block',
  }

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  }

  return (
    <div style={{
      width: '100vw',
      height: '100dvh',
      background: '#080808',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans), sans-serif',
    }}>

      {/*
        Contenedor principal:
        - position: relative → para posicionar el overlay absolute adentro
        - overflow: hidden → para que el overlay no se salga
        - display: flex → los dos formularios quedan side by side
      */}
      <div className="prode-container" style={{
        height: '100%',
        maxHeight: 560,
        borderRadius: 24,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        overflow: 'hidden',
        display: 'flex',
        background: '#111',
      }}>

        {/* ── FORMULARIO LOGIN (izquierda, 50%) ── */}
        <div className="prode-form" style={{
          width: '50%',
          height: '100%',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 32px',
          gap: 20,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Bienvenido</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              Ingresá con tu WhatsApp
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>WhatsApp</label>
              <input
                type="tel" value={telLogin} onChange={e => setTelLogin(e.target.value)}
                placeholder="+54 9 2901..."
                onKeyDown={e => e.key === 'Enter' && login()}
                style={inputStyle}
              />
            </div>
            {errorLogin && (
              <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>{errorLogin}</div>
            )}
          </div>

          <button onClick={login} disabled={loading} style={{
            width: '100%',
            background: 'linear-gradient(135deg, #d4a84c, #c9a84c)',
            color: '#1a1000',
            border: 'none',
            borderRadius: 10,
            padding: '12px',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Buscando...' : 'Ingresar →'}
          </button>
        </div>

        {/* ── FORMULARIO REGISTRO (derecha, 50%) ── */}
        <div className="prode-form" style={{
          width: '50%',
          height: '100%',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 32px',
          gap: 16,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Crear cuenta</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              Registrate gratis para jugar
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ ...fieldStyle, flex: 1 }}>
                <label style={labelStyle}>Nombre</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Martín" style={inputStyle} />
              </div>
              <div style={{ ...fieldStyle, flex: 1 }}>
                <label style={labelStyle}>Apellido</label>
                <input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="García" style={inputStyle} />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>WhatsApp</label>
              <input
                type="tel" value={telRegister} onChange={e => setTelRegister(e.target.value)}
                placeholder="+54 9 2901 123456"
                onKeyDown={e => e.key === 'Enter' && registrar()}
                style={inputStyle}
              />
            </div>
            {errorRegister && (
              <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>{errorRegister}</div>
            )}
          </div>

          <button onClick={registrar} disabled={loading} style={{
            width: '100%',
            background: 'linear-gradient(135deg, #d4a84c, #c9a84c)',
            color: '#1a1000',
            border: 'none',
            borderRadius: 10,
            padding: '12px',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Creando...' : 'Crear cuenta →'}
          </button>
        </div>

        {/*
          ── OVERLAY DESLIZANTE (50% ancho, z-index alto) ──
          - Siempre renderizado en el DOM
          - Se mueve de x:0% → x:100% cuando isSignUp=true
          - Tapa el formulario activo y revela el otro
        */}
        <motion.div
          className="prode-overlay"
          animate={{ x: isSignUp ? '100%' : '0%' }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '50%',
            height: '100%',
            zIndex: 10,
            background: 'linear-gradient(160deg, #1c1200 0%, #0d0d0d 50%, #1a1000 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            padding: '40px 32px',
          }}
        >
          {/* Glow */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,168,76,0.1) 0%, transparent 70%)',
          }} />

          {/* Logo */}
          <div style={{ position: 'relative', width: 56, height: 56 }}>
            <div style={{
              position: 'absolute', inset: -10, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(201,168,76,0.2) 0%, transparent 70%)',
            }} />
            <div style={{
              position: 'relative', width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(201,168,76,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 13,
            }}>
              <img src="https://www.lacocinaushuaia.com.ar/logo-blanco.svg" alt="La Cocina" style={{ width: '100%', objectFit: 'contain' }} />
            </div>
          </div>

          {/* Texto dinámico según estado */}
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: '#c9a84c', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              Prode Mundial 2026
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              {isSignUp ? 'Ya tenés\ncuenta?' : '¿Primera\nvez?'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 1.5 }}>
              {isSignUp
                ? 'Ingresá con tu WhatsApp\ny seguí acumulando puntos'
                : 'Registrate gratis y ganá\npremios reales en La Cocina'}
            </div>
          </div>

          {/* Divisor */}
          <div style={{ width: 32, height: 1, background: 'rgba(201,168,76,0.3)' }} />

          {/* Ghost button */}
          <button
            onClick={() => setIsSignUp(prev => !prev)}
            style={{
              position: 'relative',
              background: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 10,
              padding: '10px 28px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.02em',
              transition: 'border-color 180ms ease, background 180ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
              e.currentTarget.style.background = 'rgba(201,168,76,0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {isSignUp ? 'Iniciar sesión' : 'Registrarme'}
          </button>
        </motion.div>

      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(201,168,76,0.4) !important; }
        @media (max-width: 600px) {
          .prode-container {
            max-height: 100dvh !important;
            border-radius: 0 !important;
          }
          .prode-form {
            padding: 28px 20px !important;
          }
          .prode-overlay {
            padding: 28px 20px !important;
          }
          .prode-overlay-title {
            font-size: 1rem !important;
          }
          .prode-overlay-sub {
            font-size: 0.65rem !important;
          }
        }
      `}</style>
    </div>
  )
}