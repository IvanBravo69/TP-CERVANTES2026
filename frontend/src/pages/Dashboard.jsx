import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStats } from '../api/stats'
import { getPagos } from '../api/finanzas'
import Spinner from '../components/Spinner'

const STAT_CFG = [
  { key:'total_clientes',    label:'Clientes activos',     icon:'bi-people-fill',            bg:'#f5f3ff', color:'#7c3aed' },
  { key:'total_propiedades', label:'Propiedades',          icon:'bi-building-fill',           bg:'#eff6ff', color:'#1d4ed8' },
  { key:'disponibles',       label:'Disponibles',          icon:'bi-check-circle-fill',       bg:'#f0fdf4', color:'#15803d' },
  { key:'alquiladas',        label:'Alquiladas',           icon:'bi-house-fill',              bg:'#fefce8', color:'#a16207' },
  { key:'vendidas',          label:'Vendidas',             icon:'bi-currency-dollar',         bg:'#fdf4ff', color:'#9333ea' },
  { key:'contratos_activos', label:'Contratos activos',    icon:'bi-file-earmark-check-fill', bg:'#e0f2fe', color:'#0369a1' },
  { key:'total_usuarios',    label:'Usuarios del sistema', icon:'bi-person-badge-fill',       bg:'#fff1f2', color:'#be185d' },
]

const ESTADO_CFG = {
  disponibles: { label:'Disponible', fill:'#16a34a' },
  reservadas:  { label:'Reservada',  fill:'#d97706' },
  alquiladas:  { label:'Alquilada',  fill:'#1d4ed8' },
  vendidas:    { label:'Vendida',    fill:'#6b7280' },
}

const BADGE = { Disponible:'badge-disponible', Reservada:'badge-reservada', Alquilada:'badge-alquilada', Vendida:'badge-vendida' }

function fmt(n)  { return Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits:2, maximumFractionDigits:2 }) }
function fmtN(n) { return Number(n || 0).toLocaleString('es-AR') }

function primerDiaMes() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
}
function hoy() { return new Date().toISOString().split('T')[0] }

export default function Dashboard() {
  const { user } = useAuth()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [desde,   setDesde]   = useState(primerDiaMes)
  const [hasta,   setHasta]   = useState(hoy)
  const [totales, setTotales] = useState(null)
  const [loadFin, setLoadFin] = useState(false)

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Buenos dias' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
  const name = user?.full_name?.split(' ')[0] || user?.username || 'usuario'
  const days   = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado']
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const now = new Date()
  const dateStr = `${days[now.getDay()]} ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`

  useEffect(() => {
    getStats().then(r => { if (r?.success) setStats(r.data) }).finally(() => setLoading(false))
  }, [])

  const loadFinanzas = useCallback(async () => {
    if (!desde || !hasta) return
    setLoadFin(true)
    try {
      const r = await getPagos({ desde, hasta, limit: 1 })
      if (r?.success) setTotales(r.data.totales)
    } finally { setLoadFin(false) }
  }, [desde, hasta])

  useEffect(() => { loadFinanzas() }, [loadFinanzas])

  const total = stats?.total_propiedades || 1

  const finCards = totales ? [
    { label:'Cobrado ARS', val:`$ ${fmt(totales.ing_ars)}`,   icon:'bi-arrow-down-circle-fill', color:'#15803d', bg:'#f0fdf4' },
    { label:'Cobrado USD', val:`U$S ${fmt(totales.ing_usd)}`, icon:'bi-arrow-down-circle-fill', color:'#1d4ed8', bg:'#eff6ff' },
    { label:'Pagado ARS',  val:`$ ${fmt(totales.eg_ars)}`,    icon:'bi-arrow-up-circle-fill',   color:'#dc2626', bg:'#fef2f2' },
    { label:'Pagado USD',  val:`U$S ${fmt(totales.eg_usd)}`,  icon:'bi-arrow-up-circle-fill',   color:'#dc2626', bg:'#fef2f2' },
    { label:'Balance ARS', val:`$ ${fmt(totales.ing_ars - totales.eg_ars)}`, icon:'bi-graph-up-arrow', color:'#7c3aed', bg:'#f5f3ff' },
    { label:'Balance USD', val:`U$S ${fmt(totales.ing_usd - totales.eg_usd)}`, icon:'bi-graph-up-arrow', color:'#7c3aed', bg:'#f5f3ff' },
  ] : []

  return (
    <>
      <div className="welcome-banner">
        <h2>{greeting}, {name}</h2>
        <p>{dateStr}</p>
        <i className="bi bi-buildings-fill banner-icon" />
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem' }}><Spinner size={32} /></div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(185px,1fr))', gap:'.875rem', marginBottom:'1.5rem' }}>
            {STAT_CFG.map(cfg => (
              <div key={cfg.key} className="stat-card">
                <div className="stat-card-inner">
                  <div className="stat-icon" style={{ background: cfg.bg, color: cfg.color }}>
                    <i className={`bi ${cfg.icon}`} />
                  </div>
                  <div>
                    <div className="stat-value">{fmtN(stats?.[cfg.key])}</div>
                    <div className="stat-label">{cfg.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom:'1rem', padding:'1rem 1.25rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
              <span style={{ fontWeight:600, fontSize:'.875rem' }}>
                <i className="bi bi-calendar-range" style={{ marginRight:'.4rem' }} />
                Resumen financiero del periodo
              </span>
              <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginLeft:'auto', flexWrap:'wrap' }}>
                <label style={{ fontSize:'.8rem', color:'var(--tx-3)' }}>Desde</label>
                <input type="date" className="filter-input" style={{ width:145 }}
                  value={desde} onChange={e => setDesde(e.target.value)} />
                <label style={{ fontSize:'.8rem', color:'var(--tx-3)' }}>Hasta</label>
                <input type="date" className="filter-input" style={{ width:145 }}
                  value={hasta} onChange={e => setHasta(e.target.value)} />
              </div>
            </div>
          </div>

          {loadFin ? (
            <div style={{ textAlign:'center', padding:'1.5rem' }}><Spinner /></div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(185px,1fr))', gap:'.875rem', marginBottom:'1.5rem' }}>
              {finCards.map(c => (
                <div key={c.label} className="stat-card">
                  <div className="stat-card-inner">
                    <div className="stat-icon" style={{ background:c.bg, color:c.color }}>
                      <i className={`bi ${c.icon}`} />
                    </div>
                    <div>
                      <div className="stat-value" style={{ fontSize:'1rem' }}>{c.val}</div>
                      <div className="stat-label">{c.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="card">
              <div className="card-header">
                <h6><i className="bi bi-pie-chart me-2" />Propiedades por estado</h6>
              </div>
              {Object.entries(ESTADO_CFG).map(([key, cfg]) => {
                const val = stats?.[key] || 0
                const pct = Math.round((val / total) * 100)
                return (
                  <div key={key} className="progress-row">
                    <div className="progress-row-top">
                      <span style={{ fontSize:'.8rem', fontWeight:600, color:'var(--tx-2)' }}>{cfg.label}</span>
                      <span style={{ fontSize:'.8rem', fontWeight:700, color:'var(--tx-1)' }}>{fmtN(val)} <span style={{ fontWeight:400, color:'var(--tx-4)' }}>({pct}%)</span></span>
                    </div>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width:`${pct}%`, background: cfg.fill }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="card">
              <div className="card-header">
                <h6><i className="bi bi-clock-history me-2" />Ultimas propiedades</h6>
                <Link to="/propiedades" className="btn btn-outline btn-sm">Ver todas</Link>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Titulo</th><th>Tipo</th><th>Estado</th></tr></thead>
                  <tbody>
                    {(stats?.ultimas_propiedades || []).length === 0
                      ? <tr><td colSpan={3}><div className="empty-state"><i className="bi bi-building" />Sin propiedades</div></td></tr>
                      : (stats?.ultimas_propiedades || []).map(p => (
                        <tr key={p.id}>
                          <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.titulo}</td>
                          <td>{p.tipo}</td>
                          <td><span className={`badge ${BADGE[p.estado] || ''}`}>{p.estado}</span></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
