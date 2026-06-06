import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getHonorarios, createHonorario, cobrarHonorario, getConfig, updateConfig } from '../../api/honorarios'
import { getContratos } from '../../api/contratos'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

const EMPTY = { contrato_id:'', tipo:'Honorario_Alquiler', concepto:'', monto:'', moneda:'ARS', fecha_generacion:'' }

export default function HonorariosPage() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ tipo:'', estado:'', moneda:'' })
  const [modal, setModal]     = useState({ open:false, data: EMPTY })
  const [cobrarModal, setCobrarModal] = useState({ open:false, item:null, fecha:'' })
  const [configModal, setConfigModal] = useState({ open:false, configs:[] })
  const [saving, setSaving]   = useState(false)
  const [contratos, setContratos] = useState([])
  const LIMIT = 20

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '')) }
      const res = await getHonorarios(params)
      if (res?.success) { setRows(res.data.rows); setTotal(res.data.total) }
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load(page) }, [page])
  useEffect(() => { setPage(1); load(1) }, [filters])

  async function openModal() {
    setModal({ open:true, data:{ ...EMPTY, fecha_generacion: new Date().toISOString().slice(0,10) } })
    const rc = await getContratos({ limit:200 })
    if (rc?.success) setContratos(rc.data.rows)
  }

  async function openConfig() {
    const res = await getConfig()
    if (res?.success) setConfigModal({ open:true, configs: res.data })
    else toast.error('Error al cargar configuraciÃ³n')
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { ...modal.data, monto: Number(modal.data.monto), contrato_id: modal.data.contrato_id || null }
      const res = await createHonorario(payload)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('Honorario registrado')
      setModal(m => ({ ...m, open:false })); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  async function handleCobrar() {
    const { item, fecha } = cobrarModal
    setCobrarModal(p => ({ ...p, open:false }))
    try {
      const res = await cobrarHonorario(item.id, fecha || null)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('Honorario cobrado'); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
  }

  async function handleSaveConfig() {
    setSaving(true)
    try {
      const res = await updateConfig(configModal.configs)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('ConfiguraciÃ³n actualizada')
      setConfigModal(c => ({ ...c, open:false }))
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  const set  = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))
  const setF = k => e => setModal(m => ({ ...m, data: { ...m.data, [k]: e.target.value } }))
  const TIPOS = ['Honorario_Venta','Honorario_Alquiler','Administracion']
  const fmt = n => Number(n||0).toLocaleString('es-AR', { minimumFractionDigits:2 })

  return (
    <>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>Honorarios</h1><p>Honorarios y comisiones de la inmobiliaria</p></div>
        <div style={{ display:'flex', gap:'.5rem' }}>
          <button className="btn btn-outline" onClick={openConfig}><i className="bi bi-gear" /> Configurar %</button>
          <button className="btn btn-primary" onClick={openModal}><i className="bi bi-plus-lg" /> Registrar</button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Tipo</label>
          <select className="filter-input" value={filters.tipo} onChange={set('tipo')}>
            <option value="">Todos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Estado</label>
          <select className="filter-input" value={filters.estado} onChange={set('estado')}>
            <option value="">Todos</option><option>Pendiente</option><option>Cobrado</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Moneda</label>
          <select className="filter-input" value={filters.moneda} onChange={set('moneda')}>
            <option value="">Todas</option><option>ARS</option><option>USD</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? <div style={{ textAlign:'center', padding:'3rem' }}><Spinner /></div> : (
            <table>
              <thead><tr><th>Tipo</th><th>Concepto</th><th>Monto</th><th>Estado</th><th>Generado</th><th>Cobrado</th><th>Contrato</th><th>Acciones</th></tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={8}><EmptyState icon="bi-percent" message="No hay honorarios" /></td></tr>
                  : rows.map(r => (
                    <tr key={r.id}>
                      <td><span className="badge" style={{ background:'#fdf4ff', color:'#9333ea' }}>{r.tipo.replace(/_/g,' ')}</span></td>
                      <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.concepto || 'â€”'}</td>
                      <td style={{ fontWeight:600 }}>{r.moneda} {fmt(r.monto)}</td>
                      <td><span className={`badge badge-${r.estado === 'Cobrado' ? 'activo' : 'inactivo'}`}>{r.estado}</span></td>
                      <td>{r.fecha_generacion ? new Date(r.fecha_generacion).toLocaleDateString('es-AR') : 'â€”'}</td>
                      <td>{r.fecha_cobro ? new Date(r.fecha_cobro).toLocaleDateString('es-AR') : 'â€”'}</td>
                      <td style={{ fontSize:'.8rem' }}>{r.contrato_id ? `#${r.contrato_id}` : 'â€”'}</td>
                      <td><div className="table-actions">
                        {r.estado !== 'Cobrado' && (
                          <button className="btn btn-success btn-sm btn-icon" title="Marcar cobrado"
                            onClick={() => setCobrarModal({ open:true, item:r, fecha:'' })}>
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

      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open:false }))} title="Registrar honorario"
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(m => ({ ...m, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size={14} /> : 'Guardar'}</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group"><label className="form-label">Tipo *</label>
            <select className="form-select" value={modal.data.tipo} onChange={setF('tipo')}>
              {TIPOS.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Moneda</label>
            <select className="form-select" value={modal.data.moneda} onChange={setF('moneda')}>
              <option>ARS</option><option>USD</option>
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Concepto</label>
          <input className="form-control" value={modal.data.concepto||''} onChange={setF('concepto')} />
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Monto *</label>
            <input className="form-control" type="number" min="0" step="0.01" value={modal.data.monto||''} onChange={setF('monto')} />
          </div>
          <div className="form-group"><label className="form-label">Fecha</label>
            <input className="form-control" type="date" value={modal.data.fecha_generacion||''} onChange={setF('fecha_generacion')} />
          </div>
        </div>
        <div className="form-group"><label className="form-label">Contrato</label>
          <select className="form-select" value={modal.data.contrato_id||''} onChange={setF('contrato_id')}>
            <option value="">Sin contrato</option>
            {contratos.map(c => <option key={c.id} value={c.id}>#{c.id} â€” {c.propiedad_titulo || c.id}</option>)}
          </select>
        </div>
      </Modal>

      <Modal open={cobrarModal.open} onClose={() => setCobrarModal(p => ({ ...p, open:false }))} title="Registrar cobro"
        footer={<>
          <button className="btn btn-outline" onClick={() => setCobrarModal(p => ({ ...p, open:false }))}>Cancelar</button>
          <button className="btn btn-success" onClick={handleCobrar}>Confirmar cobro</button>
        </>}
      >
        <p style={{ marginBottom:'1rem' }}>Honorario: <strong>{cobrarModal.item?.tipo?.replace(/_/g,' ')} â€” {cobrarModal.item?.moneda} {fmt(cobrarModal.item?.monto)}</strong></p>
        <div className="form-group"><label className="form-label">Fecha de cobro</label>
          <input className="form-control" type="date" value={cobrarModal.fecha}
            onChange={e => setCobrarModal(p => ({ ...p, fecha: e.target.value }))} />
        </div>
      </Modal>

      <Modal open={configModal.open} onClose={() => setConfigModal(c => ({ ...c, open:false }))} title="Configurar comisiones %"
        footer={<>
          <button className="btn btn-outline" onClick={() => setConfigModal(c => ({ ...c, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSaveConfig} disabled={saving}>{saving ? <Spinner size={14} /> : 'Guardar'}</button>
        </>}
      >
        {configModal.configs.map((cfg, i) => (
          <div key={cfg.tipo} className="form-group">
            <label className="form-label">{cfg.tipo.replace(/_/g,' ')} (%)</label>
            <input className="form-control" type="number" min="0" max="100" step="0.01"
              value={cfg.porcentaje}
              onChange={e => setConfigModal(c => ({
                ...c,
                configs: c.configs.map((x, j) => j === i ? { ...x, porcentaje: e.target.value } : x)
              }))} />
          </div>
        ))}
      </Modal>
    </>
  )
}

