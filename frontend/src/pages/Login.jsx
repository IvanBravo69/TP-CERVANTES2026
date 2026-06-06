import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login: setSession, token } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  if (token) { navigate('/dashboard', { replace: true }); return null }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(form)
      if (!res?.success) { setError(res?.message || 'Error al iniciar sesión'); return }
      setSession(res.data.token, res.data.usuario)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-icon"><i className="bi bi-buildings-fill" /></div>
            <h4>Sistema Britos</h4>
            <p>Gestión Inmobiliaria</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Usuario</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-person" style={{ position:'absolute', left:'.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--tx-4)', fontSize:'.875rem' }} />
                <input className="form-control" style={{ paddingLeft:'2.25rem' }}
                  value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Ingresá tu usuario" autoComplete="username" required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-lock" style={{ position:'absolute', left:'.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--tx-4)', fontSize:'.875rem' }} />
                <input className="form-control" style={{ paddingLeft:'2.25rem', paddingRight:'2.5rem' }}
                  type={showPwd ? 'text' : 'password'}
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••" autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  style={{ position:'absolute', right:'.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--tx-4)', padding:0, fontSize:'.875rem' }}>
                  <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background:'var(--red-bg)', border:'1px solid #fecaca', color:'var(--red)', borderRadius:'var(--r-sm)', padding:'.6rem .875rem', fontSize:'.8rem', marginBottom:'1rem' }}>
                <i className="bi bi-exclamation-circle" /> {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100" style={{ height: 40 }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>

      <div className="login-right-panel">
        <div className="login-brand">
          <div className="brand-logo"><i className="bi bi-buildings-fill" /></div>
          <h3>Sistema Britos</h3>
          <p>Plataforma integral de gestión inmobiliaria</p>
        </div>
        <div className="feature-list">
          {[
            { icon:'bi-people-fill',               title:'Gestión de Clientes',     desc:'Propietarios, inquilinos y compradores centralizados' },
            { icon:'bi-building-fill',             title:'Catálogo de Propiedades',  desc:'Filtros por tipo, precio, ciudad y estado' },
            { icon:'bi-file-earmark-text-fill',    title:'Contratos y Finanzas',     desc:'Alquileres, ventas y registro de cobros' },
            { icon:'bi-shield-lock-fill',          title:'Roles y Permisos',         desc:'Control de acceso por área de trabajo' },
          ].map(f => (
            <div key={f.title} className="feature-item">
              <div className="feature-icon"><i className={`bi ${f.icon}`} /></div>
              <div><h6>{f.title}</h6><p>{f.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
