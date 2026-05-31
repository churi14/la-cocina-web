'use client'

import { useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Usuario {
  id: string
  nombre: string
  apellido: string
  telefono: string
}

interface ProdeAuthProps {
  onSuccess: (usuario: Usuario) => void
}

export default function ProdeAuth({ onSuccess }: ProdeAuthProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const overlayControls = useAnimationControls()

  async function handleSwitch() {
    setError('')
    // 1. Overlay entra desde la derecha
    await overlayControls.start({
      x: 0,
      transition: { duration: 0.38, ease: [0.77, 0, 0.175, 1] as [number, number, number, number] }
    })
    // 2. Cambia el estado (en este momento el overlay tapa todo)
    setIsSignUp(prev => !prev)
    setNombre(''); setApellido(''); setTelefono('')
    // 3. Overlay sale hacia la izquierda
    await overlayControls.start({
      x: '-100%',
      transition: { duration: 0.38, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }
    })
    // 4. Reset a la derecha sin animación (para el próximo switch)
    overlayControls.set({ x: '100%' })
  }

  async function registrar() {
    if (!nombre.trim() || !apellido.trim() || !telefono.trim()) {
      setError('Completá todos los campos'); return
    }
    setLoading(true); setError('')
    const { data: existente } = await supabase
      .from('usuarios').select('*').eq('telefono', telefono.trim()).single()
    if (existente) { onSuccess(existente); setLoading(false); return }

    const { data, error: err } = await supabase
      .from('usuarios')
      .insert({ nombre: nombre.trim(), apellido: apellido.trim(), telefono: telefono.trim() })
      .select().single()
    setLoading(false)
    if (err) { setError('Error al crear la cuenta. Intentá de nuevo.'); return }
    onSuccess(data)
  }

  async function login() {
    if (!telefono.trim()) { setError('Ingresá tu WhatsApp'); return }
    setLoading(true); setError('')
    const { data } = await supabase
      .from('usuarios').select('*').eq('telefono', telefono.trim()).single()
    setLoading(false)
    if (!data) { setError('No encontramos esa cuenta. ¿Ya te registraste?'); return }
    onSuccess(data)
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '13px 16px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    transition: 'border-color 160ms ease',
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100dvh',
      overflow: 'hidden',
      background: '#080808',
      fontFamily: 'var(--font-sans), sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>

      {/* ── FORMULARIO ACTIVO ── */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 24px 48px',
        justifyContent: 'center',
        gap: 24,
      }}>

        {/* Logo + título */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{
            position: 'relative',
            width: 68, height: 68,
          }}>
            <div style={{
              position: 'absolute', inset: -12, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)',
            }} />
            <div style={{
              position: 'relative', width: 68, height: 68, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
              boxShadow: '0 0 0 1px rgba(201,168,76,0.08), 0 16px 40px rgba(0,0,0,0.5)',
            }}>
              <img src="https://www.lacocinaushuaia.com.ar/logo-blanco.svg" alt="La Cocina" style={{ width: '100%', objectFit: 'contain' }} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#c9a84c', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
              La Cocina · Prode
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {isSignUp ? 'Crear cuenta' : 'Bienvenido'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#6b6560', marginTop: 5 }}>
              {isSignUp
                ? 'Registrate gratis para jugar el Prode'
                : 'Ingresá con tu WhatsApp para continuar'}
            </div>
          </div>
        </div>

        {/* Campos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isSignUp && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.7rem', color: '#6b6560', fontWeight: 600 }}>Nombre</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Martín" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.7rem', color: '#6b6560', fontWeight: 600 }}>Apellido</label>
                <input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Ej: García" style={inputStyle} />
              </div>
            </>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: '0.7rem', color: '#6b6560', fontWeight: 600 }}>
              {isSignUp ? 'WhatsApp (para recibir premios)' : 'Tu WhatsApp'}
            </label>
            <input
              type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
              placeholder="+54 9 2901 123456"
              onKeyDown={e => e.key === 'Enter' && (isSignUp ? registrar() : login())}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '10px 14px', fontSize: '0.78rem', color: '#ef4444'
          }}>
            {error}
          </div>
        )}

        {/* Botón submit */}
        <button
          onClick={isSignUp ? registrar : login}
          disabled={loading}
          style={{
            background: loading ? 'rgba(201,168,76,0.5)' : 'linear-gradient(135deg, #d4a84c, #c9a84c, #b8922e)',
            color: '#1a1000', border: 'none', borderRadius: 14, padding: '15px',
            fontSize: '0.95rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(201,168,76,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
            transition: 'filter 160ms ease',
          }}
        >
          {loading
            ? (isSignUp ? 'Creando cuenta...' : 'Buscando...')
            : (isSignUp ? 'Crear cuenta y jugar →' : 'Ingresar →')
          }
        </button>

        {/* Switch */}
        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6b6560' }}>
          {isSignUp ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
          <button
            onClick={handleSwitch}
            style={{
              background: 'none', border: 'none', color: '#fff',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '0.82rem', textDecoration: 'underline', padding: 0,
            }}
          >
            {isSignUp ? 'Ingresá acá' : 'Registrate gratis'}
          </button>
        </div>
      </div>

      {/* ── OVERLAY DESLIZANTE ── */}
      <motion.div
        initial={{ x: '100%' }}
        animate={overlayControls}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          background: 'linear-gradient(160deg, #1a1000 0%, #0c0c0c 40%, #1a1200 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: 40,
        }}
      >
        {/* Glow central */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,168,76,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', width: 60, height: 60 }}>
          <div style={{
            position: 'absolute', inset: -10, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.25) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'relative', width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(201,168,76,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14,
          }}>
            <img src="https://www.lacocinaushuaia.com.ar/logo-blanco.svg" alt="" style={{ width: '100%', objectFit: 'contain' }} />
          </div>
        </div>

        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#c9a84c', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>
            La Cocina · Prode Mundial 2026
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            {isSignUp ? 'Bienvenido de vuelta' : '¡Empezá a jugar!'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b6560', marginTop: 6, lineHeight: 1.6 }}>
            {isSignUp
              ? 'Ingresá con tu WhatsApp\ny seguí acumulando puntos'
              : 'Registrate gratis y ganá\npremios reales en La Cocina'}
          </div>
        </div>

        <div style={{
          width: 40, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)',
          margin: '4px 0',
        }} />

        <div style={{ display: 'flex', gap: 8 }}>
          {['🏆', '🛵', '🍔'].map(e => (
            <div key={e} style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.12)',
              borderRadius: 20, padding: '4px 10px', fontSize: '0.72rem', color: '#c9a84c'
            }}>{e}</div>
          ))}
        </div>
      </motion.div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(201,168,76,0.4) !important; }
      `}</style>
    </div>
  )
}