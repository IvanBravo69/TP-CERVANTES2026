import { useEffect, useState } from 'react'
import { getReportes, getContratos as getContratosMensuales, getTopClientes } from '../../api/stats'
import Spinner from '../../components/Spinner'

function fmt(n) { return Number(n || 0).toLocaleString('es-AR') }
function fmtM(n) { return Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits:2 }) }

export default function ReportesPage() {
  const [resumen, setResumen]     = useState(null)
  const [contratos, setContratos] = useState([])
  const [topCli, setTopCli]       = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([getReportes(), getContratosMensuales(), getTopClientes()])
      .then(([r1, r2, r3]) => {
        if (r1?.success) setResumen(r1.data)
        if (r2?.success) setContratos(r2.data)
        if (r3?.success) setTopCli(r3.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign:'center', padding:'3rem' }}><Spinner size={32} /></div>

  return (
    <>
      <div className="page-header">
        <div><h1>Reportes</h1><p>Resumen estadÃ­stico del negocio</p></div>
      </div>

      {resumen && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(185px,1fr))', gap:'.875rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Contratos activos', val: resumen.contratos_activos, icon:'bi-file-earmark-check', bg:'#e0f2fe', color:'#0369a1' },
            { label:'Ingresos ARS',      val: `$${fmtM(resumen.ingresos_ars)}`,  icon:'bi-cash-stack',  bg:'#f0fdf4', color:'#15803d' },
            { label:'Ingresos USD',      val: `U$D ${fmtM(resumen.ingresos_usd)}`, icon:'bi-currency-dollar', bg:'#eff6ff', color:'#1d4ed8' },
            { label:'Hon. pendientes',   val: resumen.honorarios_pendientes, icon:'bi-percent', bg:'#fdf4ff', color:'#9333ea' },
            { label:'Servicios pend.',   val: resumen.servicios_pendientes,  icon:'bi-receipt', bg:'#fefce8', color:'#a16207' },
          ].map(c => (
            <div key={c.label} className="stat-card">
              <div className="stat-card-inner">
                <div className="stat-icon" style={{ background:c.bg, color:c.color }}><i className={`bi ${c.icon}`} /></div>
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
            <h6><i className="bi bi-bar-chart me-2" />Contratos firmados por mes</h6>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Mes</th><th>Cantidad</th></tr></thead>
              <tbody>
                {contratos.length === 0
                  ? <tr><td colSpan={2}><div className="empty-state"><i className="bi bi-calendar" />Sin datos</div></td></tr>
                  : contratos.map((r, i) => (
                    <tr key={i}>
                      <td>{r.mes}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                          <div style={{ height:8, borderRadius:4, background:'var(--primary)', width: `${Math.max(4, (r.cantidad / Math.max(...contratos.map(x=>x.cantidad||1))) * 120)}px` }} />
                          <strong>{r.cantidad}</strong>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h6><i className="bi bi-trophy me-2" />Top clientes</h6>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>#</th><th>Cliente</th><th>Contratos</th></tr></thead>
              <tbody>
                {topCli.length === 0
                  ? <tr><td colSpan={3}><div className="empty-state"><i className="bi bi-people" />Sin datos</div></td></tr>
                  : topCli.map((r, i) => (
                    <tr key={r.id}>
                      <td style={{ width:32, color:'var(--tx-4)', fontWeight:700 }}>{i + 1}</td>
                      <td><strong>{r.apellido} {r.nombre || ''}</strong></td>
                      <td><span className="badge" style={{ background:'#eff6ff', color:'#1d4ed8' }}>{r.total_contratos}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

