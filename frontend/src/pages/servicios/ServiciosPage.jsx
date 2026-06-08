import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getServicios, createServicio, updateServicio, pagarServicio } from '../../api/servicios'
import { getContratos } from '../../api/contratos'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

const EMPTY = { contrato_id:'', tipo:'ABL', monto:'', moneda:'ARS', fecha_vencimiento:'', periodo:'' }

export default function ServiciosPage() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ tipo:'', estado:'', contrato_id:'' })
  const [modal, setModal]     = useState({ open:false, data: EMPTY })
  const [pagarModal, setPagarModal] = useState({ open:false, item:null, fecha:'' })
  const [saving, setSaving]   = useState(false)
  const [contratos, setContratos] = useState([])
  const LIMIT = 20

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '')) }
      const res = await getServicios(params)
      if (res?.success) { setRows(res.data.rows); setTotal(res.data.total) }
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load(page) }, [page])
  useEffect(() => { setPage(1); load(1) }, [filters])

  async function openModal(data = { ...EMPTY }) {
    setModal({ open:true, data })
    const rc = await getContratos({ limit:200 })
    if (rc?.success) setContratos(rc.data.rows)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { ...modal.data, monto: Number(modal.data.monto), contrato_id: modal.data.contrato_id || null }
      const res = modal.data.id ? await updateServicio(modal.data.id, payload) : await createServicio(payload)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success(modal.data.id ? 'Servicio actualizado' : 'Servicio creado')
      setModal(m => ({ ...m, open:false })); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  async function handlePagar() {
    const { item, fecha } = pagarModal
    setPagarModal(p => ({ ...p, open:false }))
    try {
      const res = await pagarServicio(item.id, fecha || null)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('Servicio marcado como pagado'); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
  }

  const set  = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))
  const setF = k => e => setModal(m => ({ ...m, data: { ...m.data, [k]: e.target.value } }))
  const TIPOS = ['ABL','Luz','Gas','Agua','Expensas','Municipal','Otro']

  return (
    <>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>Servicios e Impuestos</h1><p>ABL, luz, gas y otros servicios</p></div>
        <button className="btn btn-primary" onClick={() => openModal()}><i className="bi bi-plus-lg" /> Servicio</button>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Tipo</label>
          <select className="filter-input" value={filters.tipo} onChange={set('tipo')}>
            <option value="">Todos</option>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Estado</label>
          <select className="filter-input" value={filters.estado} onChange={set('estado')}>
            <option value="">Todos</option><option>Pendiente</option><option>Pagado</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? <div style={{ textAlign:'center', padding:'3rem' }}><Spinner /></div> : (
            <table>
              <thead><tr><th>Tipo</th><th>Período</th><th>Vencimiento</th><th>Monto</th><th>Estado</th><th>Contrato</th><th>Acciones</th></tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={7}><EmptyState icon="bi-receipt" message="No hay servicios" /></td></tr>
                  : rows.map(r => (
                    <tr key={r.id}>
                      <td><span className="badge" style={{ background:'#e0f2fe', color:'#0369a1' }}>{r.tipo}</span></td>
                      <td>{r.periodo || '—'}</td>
                      <td>{r.fecha_vencimiento ? new Date(r.fecha_vencimiento).toLocaleDateString('es-AR') : '—'}</td>
                      <td style={{ fontWeight:600 }}>{r.moneda} {Number(r.monto).toLocaleString('es-AR')}</td>
                      <td><span className={`badge badge-${r.estado === 'Pagado' ? 'activo' : 'inactivo'}`}>{r.estado}</span></td>
                      <td style={{ fontSize:'.8rem' }}>{r.contrato_id ? `#${r.contrato_id}` : '—'}</td>
                      <td><div className="table-actions">
                        <button className="btn btn-outline btn-sm btn-icon" title="Editar" onClick={() => openModal({ ...r })}>
                          <i className="bi bi-pencil" /></button>
                        {r.estado !== 'Pagado' && (
                          <button className="btn btn-success btn-sm btn-icon" title="Marcar pagado"
                            onClick={() => setPagarModal({ open:true, item:r, fecha:'' })}>
                            <i className="bi bi-check-lg" /></button>
                        )}
                      </div></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination total={total} page={page} limit={LIMIT} onPage={setPage} />
      </div>

      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open:false }))} title={modal.data.id ? 'Editar servicio' : 'Servicio'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(m => ({ ...m, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size={14} /> : 'Guardar'}</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group"><label className="form-label">Tipo *</label>
            <select className="form-select" value={modal.data.tipo} onChange={setF('tipo')}>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Moneda</label>
            <select className="form-select" value={modal.data.moneda} onChange={setF('moneda')}>
              <option>ARS</option><option>USD</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Monto *</label>
            <input className="form-control" type="number" min="0" step="0.01" value={modal.data.monto||''} onChange={setF('monto')} />
          </div>
          <div className="form-group"><label className="form-label">Período</label>
            <input className="form-control" placeholder="ej: 2025-01" value={modal.data.periodo||''} onChange={setF('periodo')} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Vencimiento</label>
            <input className="form-control" type="date" value={modal.data.fecha_vencimiento||''} onChange={setF('fecha_vencimiento')} />
          </div>
          <div className="form-group"><label className="form-label">Contrato</label>
            <select className="form-select" value={modal.data.contrato_id||''} onChange={setF('contrato_id')}>
              <option value="">Sin contrato</option>
              {contratos.map(c => <option key={c.id} value={c.id}>#{c.id} — {c.propiedad_titulo || c.id}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={pagarModal.open} onClose={() => setPagarModal(p => ({ ...p, open:false }))} title="Registrar pago"
        footer={<>
          <button className="btn btn-outline" onClick={() => setPagarModal(p => ({ ...p, open:false }))}>Cancelar</button>
          <button className="btn btn-success" onClick={handlePagar}>Confirmar pago</button>
        </>}
      >
        <p style={{ marginBottom:'1rem' }}>Marcando como pagado: <strong>{pagarModal.item?.tipo} — {pagarModal.item?.descripcion || ''}</strong></p>
        <div className="form-group"><label className="form-label">Fecha de pago</label>
          <input className="form-control" type="date" value={pagarModal.fecha}
            onChange={e => setPagarModal(p => ({ ...p, fecha: e.target.value }))} />
        </div>
      </Modal>
    </>
  )
}
