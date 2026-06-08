import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getAgentes, createAgente, updateAgente, activarAgente, desactivarAgente } from '../../api/agentes'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

const EMPTY = { nombre:'', apellido:'', dni_cuit:'', email:'', telefono:'', matricula:'', comision_pct:0 }

export default function AgentesPage() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ search:'', activo:'' })
  const [modal, setModal]     = useState({ open:false, data: EMPTY })
  const [saving, setSaving]   = useState(false)
  const [confirm, setConfirm] = useState({ open:false, item:null })
  const LIMIT = 20

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '')) }
      const res = await getAgentes(params)
      if (res?.success) { setRows(res.data.rows); setTotal(res.data.total) }
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load(page) }, [page])
  useEffect(() => { setPage(1); load(1) }, [filters])

  async function handleSave() {
    if (!modal.data.nombre?.trim())   { toast.error('El nombre es obligatorio');   return }
    if (!modal.data.apellido?.trim()) { toast.error('El apellido es obligatorio'); return }
    setSaving(true)
    try {
      const res = modal.data.id
        ? await updateAgente(modal.data.id, modal.data)
        : await createAgente(modal.data)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success(modal.data.id ? 'Agente actualizado' : 'Agente creado')
      setModal(m => ({ ...m, open:false })); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  async function handleToggle() {
    const item = confirm.item
    setConfirm(c => ({ ...c, open:false }))
    try {
      const res = item.activo ? await desactivarAgente(item.id) : await activarAgente(item.id)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success(item.activo ? 'Agente desactivado' : 'Agente activado'); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
  }

  const set  = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))
  const setF = k => e => setModal(m => ({ ...m, data: { ...m.data, [k]: e.target.value } }))

  return (
    <>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>Agentes</h1><p>Corredores y personal de la inmobiliaria</p></div>
        <button className="btn btn-primary" onClick={() => setModal({ open:true, data:{...EMPTY} })}><i className="bi bi-plus-lg" /> Agente</button>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Buscar</label>
          <input className="filter-input" style={{ width:220 }} placeholder="Nombre, matrícula..." value={filters.search} onChange={set('search')} />
        </div>
        <div className="filter-group">
          <label>Estado</label>
          <select className="filter-input" value={filters.activo} onChange={set('activo')}>
            <option value="">Todos</option><option value="1">Activo</option><option value="0">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? <div style={{ textAlign:'center', padding:'3rem' }}><Spinner /></div> : (
            <table>
              <thead><tr><th>Nombre</th><th>Apellido</th><th>Matrícula</th><th>Teléfono</th><th>Email</th><th>Comisión %</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={8}><EmptyState icon="bi-person-badge" message="No hay agentes" /></td></tr>
                  : rows.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.nombre}</strong></td>
                      <td>{r.apellido}</td>
                      <td>{r.matricula || '—'}</td>
                      <td>{r.telefono || '—'}</td>
                      <td>{r.email || '—'}</td>
                      <td>{r.comision_pct}%</td>
                      <td><span className={`badge badge-${r.activo ? 'activo' : 'inactivo'}`}>{r.activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td><div className="table-actions">
                        <button className="btn btn-outline btn-sm btn-icon" onClick={() => setModal({ open:true, data:{...r} })}><i className="bi bi-pencil" /></button>
                        <button className={`btn btn-sm btn-icon ${r.activo ? 'btn-warning' : 'btn-success'}`} onClick={() => setConfirm({ open:true, item:r })}>
                          <i className={`bi ${r.activo ? 'bi-person-x' : 'bi-person-check'}`} /></button>
                      </div></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination total={total} page={page} limit={LIMIT} onPage={setPage} />
      </div>

      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open:false }))}
        title={modal.data.id ? 'Editar agente' : 'Agente'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(m => ({ ...m, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size={14} /> : 'Guardar'}</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group"><label className="form-label">Apellido *</label><input className="form-control" value={modal.data.apellido||''} onChange={setF('apellido')} /></div>
          <div className="form-group"><label className="form-label">Nombre *</label><input className="form-control" value={modal.data.nombre||''} onChange={setF('nombre')} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">DNI / CUIT</label><input className="form-control" value={modal.data.dni_cuit||''} onChange={setF('dni_cuit')} /></div>
          <div className="form-group"><label className="form-label">Matrícula</label><input className="form-control" value={modal.data.matricula||''} onChange={setF('matricula')} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={modal.data.email||''} onChange={setF('email')} /></div>
          <div className="form-group"><label className="form-label">Teléfono</label><input className="form-control" value={modal.data.telefono||''} onChange={setF('telefono')} /></div>
        </div>
        <div className="form-group">
          <label className="form-label">Comisión %</label>
          <input className="form-control" type="number" min="0" max="100" step="0.01" value={modal.data.comision_pct||0} onChange={setF('comision_pct')} />
        </div>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open:false }))} onConfirm={handleToggle}
        title={confirm.item?.activo ? 'Desactivar agente' : 'Activar agente'}
        message={`¿${confirm.item?.activo ? 'Desactivar' : 'Activar'} a ${confirm.item?.nombre} ${confirm.item?.apellido || ''}?`}
      />
    </>
  )
}
