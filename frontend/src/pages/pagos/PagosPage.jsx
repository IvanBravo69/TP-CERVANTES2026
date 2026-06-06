import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getPagos, createPago, deletePago } from '../../api/finanzas'
import { getContratos } from '../../api/contratos'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

const EMPTY = { contrato_id:'', concepto:'', monto:'', moneda:'ARS', fecha_pago:'', nro_comprobante:'', observaciones:'' }

export default function PagosPage() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [totales, setTotales] = useState({})
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ moneda:'', desde:'', hasta:'' })
  const [modal, setModal]     = useState({ open:false, data: EMPTY })
  const [saving, setSaving]   = useState(false)
  const [confirm, setConfirm] = useState({ open:false, item:null })
  const [contratos, setContratos] = useState([])
  const LIMIT = 20

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT, tipo:'Egreso', ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '')) }
      const res = await getPagos(params)
      if (res?.success) { setRows(res.data.rows); setTotal(res.data.total); setTotales(res.data.totales || {}) }
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load(page) }, [page])
  useEffect(() => { setPage(1); load(1) }, [filters])

  async function openModal() {
    setModal({ open:true, data:{ ...EMPTY, fecha_pago: new Date().toISOString().split('T')[0] } })
    const rc = await getContratos({ limit:200, estado:'Activo' })
    if (rc?.success) setContratos(rc.data.rows)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { ...modal.data, tipo:'Egreso', monto: Number(modal.data.monto), contrato_id: modal.data.contrato_id || null }
      const res = await createPago(payload)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('Pago registrado')
      setModal(m => ({ ...m, open:false })); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  async function handleDelete() {
    const item = confirm.item
    setConfirm(c => ({ ...c, open:false }))
    try {
      const res = await deletePago(item.id)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('Pago eliminado'); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
  }

  const set  = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))
  const setF = k => e => setModal(m => ({ ...m, data: { ...m.data, [k]: e.target.value } }))
  const fmt  = (n) => Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits:2, maximumFractionDigits:2 })

  return (
    <>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>Pagos</h1><p>Registro de egresos</p></div>
        <button className="btn btn-primary" onClick={openModal}><i className="bi bi-plus-lg" /> Registrar pago</button>
      </div>

      {Object.keys(totales).length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(185px,1fr))', gap:'.875rem', marginBottom:'1rem' }}>
          {[
            { label:'Pagado ARS', val: totales.eg_ars, color:'#b91c1c', bg:'#fef2f2' },
            { label:'Pagado USD', val: totales.eg_usd, color:'#9333ea', bg:'#fdf4ff' },
          ].map(t => (
            <div key={t.label} className="stat-card">
              <div className="stat-card-inner">
                <div className="stat-icon" style={{ background:t.bg, color:t.color }}>
                  <i className="bi bi-arrow-up-circle-fill" />
                </div>
                <div>
                  <div className="stat-value" style={{ fontSize:'1rem' }}>{fmt(t.val)}</div>
                  <div className="stat-label">{t.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="filters-bar">
        <div className="filter-group">
          <label>Moneda</label>
          <select className="filter-input" value={filters.moneda} onChange={set('moneda')}>
            <option value="">Todas</option><option>ARS</option><option>USD</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Desde</label>
          <input type="date" className="filter-input" value={filters.desde} onChange={set('desde')} />
        </div>
        <div className="filter-group">
          <label>Hasta</label>
          <input type="date" className="filter-input" value={filters.hasta} onChange={set('hasta')} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? <div style={{ textAlign:'center', padding:'3rem' }}><Spinner /></div> : (
            <table>
              <thead><tr><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Comprobante</th><th>Contrato</th><th>Acciones</th></tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={6}><EmptyState icon="bi-arrow-up-circle" message="No hay pagos" /></td></tr>
                  : rows.map(r => (
                    <tr key={r.id}>
                      <td>{r.fecha_pago ? new Date(r.fecha_pago).toLocaleDateString('es-AR') : '�'}</td>
                      <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.concepto}</td>
                      <td style={{ fontWeight:600, color:'#b91c1c' }}>- {r.moneda} {fmt(r.monto)}</td>
                      <td>{r.nro_comprobante || '�'}</td>
                      <td style={{ fontSize:'.8rem' }}>{r.contrato_id ? `#${r.contrato_id}` : '�'}</td>
                      <td><div className="table-actions">
                        <button className="btn btn-danger btn-sm btn-icon" title="Eliminar" onClick={() => setConfirm({ open:true, item:r })}>
                          <i className="bi bi-trash" /></button>
                      </div></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination total={total} page={page} limit={LIMIT} onPage={setPage} />
      </div>

      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open:false }))} title="Registrar pago"
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(m => ({ ...m, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size={14} /> : 'Guardar'}</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group"><label className="form-label">Moneda *</label>
            <select className="form-select" value={modal.data.moneda} onChange={setF('moneda')}>
              <option>ARS</option><option>USD</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Fecha *</label>
            <input className="form-control" type="date" value={modal.data.fecha_pago} onChange={setF('fecha_pago')} />
          </div>
        </div>
        <div className="form-group"><label className="form-label">Concepto *</label>
          <input className="form-control" value={modal.data.concepto} onChange={setF('concepto')} placeholder="Ej: Comisi�n, Honorarios" />
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Monto *</label>
            <input className="form-control" type="number" min="0" step="0.01" value={modal.data.monto} onChange={setF('monto')} />
          </div>
          <div className="form-group"><label className="form-label">N� Comprobante</label>
            <input className="form-control" value={modal.data.nro_comprobante} onChange={setF('nro_comprobante')} />
          </div>
        </div>
        <div className="form-group"><label className="form-label">Contrato</label>
          <select className="form-select" value={modal.data.contrato_id} onChange={setF('contrato_id')}>
            <option value="">Sin contrato</option>
            {contratos.map(c => <option key={c.id} value={c.id}>#{c.id} � {c.propiedad_titulo || c.id}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Observaciones</label>
          <textarea className="form-control" rows={2} value={modal.data.observaciones} onChange={setF('observaciones')} />
        </div>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open:false }))} onConfirm={handleDelete}
        title="Eliminar pago"
        message={`�Eliminar el pago "${confirm.item?.concepto}"? Esta acci�n no se puede deshacer.`}
      />
    </>
  )
}

