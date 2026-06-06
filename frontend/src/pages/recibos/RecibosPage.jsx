import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getRecibos, emitirRecibo } from '../../api/recibos'
import { getContratos } from '../../api/contratos'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

const EMPTY = { contrato_id:'', concepto:'', monto:'', moneda:'ARS', fecha_emision:'', observaciones:'' }

export default function RecibosPage() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ moneda:'', desde:'', hasta:'' })
  const [modal, setModal]     = useState({ open:false, data: EMPTY })
  const [saving, setSaving]   = useState(false)
  const [contratos, setContratos] = useState([])
  const LIMIT = 20

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '')) }
      const res = await getRecibos(params)
      if (res?.success) { setRows(res.data.rows); setTotal(res.data.total) }
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load(page) }, [page])
  useEffect(() => { setPage(1); load(1) }, [filters])

  async function openModal() {
    setModal({ open:true, data:{ ...EMPTY, fecha_emision: new Date().toISOString().slice(0,10) } })
    const rc = await getContratos({ limit:200 })
    if (rc?.success) setContratos(rc.data.rows)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { ...modal.data, monto: Number(modal.data.monto), contrato_id: modal.data.contrato_id || null }
      const res = await emitirRecibo(payload)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success(`Recibo #${res.data?.numero || ''} emitido`)
      setModal(m => ({ ...m, open:false })); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  const set  = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))
  const setF = k => e => setModal(m => ({ ...m, data: { ...m.data, [k]: e.target.value } }))

  return (
    <>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>Recibos</h1><p>Comprobantes de pago emitidos</p></div>
        <button className="btn btn-primary" onClick={openModal}><i className="bi bi-plus-lg" /> Emitir recibo</button>
      </div>

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
              <thead><tr><th>NÂº Recibo</th><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Contrato</th><th>Observaciones</th></tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={6}><EmptyState icon="bi-receipt-cutoff" message="No hay recibos" /></td></tr>
                  : rows.map(r => (
                    <tr key={r.id}>
                      <td><strong style={{ color:'var(--primary)' }}>#{String(r.numero).padStart(6,'0')}</strong></td>
                      <td>{r.fecha_emision ? new Date(r.fecha_emision).toLocaleDateString('es-AR') : 'â€”'}</td>
                      <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.concepto}</td>
                      <td style={{ fontWeight:600 }}>{r.moneda} {Number(r.monto).toLocaleString('es-AR', { minimumFractionDigits:2 })}</td>
                      <td style={{ fontSize:'.8rem' }}>{r.contrato_id ? `#${r.contrato_id}` : 'â€”'}</td>
                      <td style={{ fontSize:'.8rem', color:'var(--tx-3)' }}>{r.observaciones || 'â€”'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination total={total} page={page} limit={LIMIT} onPage={setPage} />
      </div>

      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open:false }))} title="Emitir recibo"
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(m => ({ ...m, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size={14} /> : 'Emitir'}</button>
        </>}
      >
        <p style={{ fontSize:'.85rem', color:'var(--tx-3)', marginBottom:'1rem' }}>
          El nÃºmero de recibo se asignarÃ¡ automÃ¡ticamente al emitir.
        </p>
        <div className="form-group"><label className="form-label">Concepto *</label>
          <input className="form-control" value={modal.data.concepto} onChange={setF('concepto')} />
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Monto *</label>
            <input className="form-control" type="number" min="0" step="0.01" value={modal.data.monto} onChange={setF('monto')} />
          </div>
          <div className="form-group"><label className="form-label">Moneda</label>
            <select className="form-select" value={modal.data.moneda} onChange={setF('moneda')}>
              <option>ARS</option><option>USD</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Fecha de emisiÃ³n *</label>
            <input className="form-control" type="date" value={modal.data.fecha_emision} onChange={setF('fecha_emision')} />
          </div>
          <div className="form-group"><label className="form-label">Contrato</label>
            <select className="form-select" value={modal.data.contrato_id} onChange={setF('contrato_id')}>
              <option value="">Sin contrato</option>
              {contratos.map(c => <option key={c.id} value={c.id}>#{c.id} â€” {c.propiedad_titulo || c.id}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Observaciones</label>
          <textarea className="form-control" rows={2} value={modal.data.observaciones} onChange={setF('observaciones')} />
        </div>
      </Modal>
    </>
  )
}

