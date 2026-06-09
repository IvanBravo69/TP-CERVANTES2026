import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getClientes, createCliente, updateCliente, activarCliente, desactivarCliente } from '../../api/clientes'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

const EMPTY = {
  tipo:'Inquilino', dni_cuit:'', nombre:'', apellido:'',
  pais:'Argentina', provincia:'', email:'', telefono:'', direccion:''
}

export default function ClientesPage() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ search:'', tipo:'', activo:'' })
  const [modal, setModal]     = useState({ open:false, data: EMPTY })
  const [saving, setSaving]   = useState(false)
  const [confirm, setConfirm] = useState({ open:false, item:null })
  const LIMIT = 20

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page: p, limit: LIMIT, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '')) }
      const res = await getClientes(params)
      if (res?.success) { setRows(res.data.rows); setTotal(res.data.total) }
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load(page) }, [page])
  useEffect(() => { setPage(1); load(1) }, [filters])

  function openNew()   { setModal({ open:true, data: { ...EMPTY } }) }
  function openEdit(r) { setModal({ open:true, data: { ...r } }) }

  async function handleSave() {
    if (!modal.data.nombre?.trim())   { toast.error('El nombre es obligatorio');   return }
    if (!modal.data.apellido?.trim()) { toast.error('El apellido es obligatorio'); return }
    if (modal.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modal.data.email)) {
      toast.error('El email no tiene un formato válido'); return
    }
    setSaving(true)
    try {
      const payload = {
        tipo:      modal.data.tipo,
        dni_cuit:  modal.data.dni_cuit  || undefined,
        nombre:    modal.data.nombre,
        apellido:  modal.data.apellido,
        email:     modal.data.email     || undefined,
        telefono:  modal.data.telefono  || undefined,
        direccion: modal.data.direccion || undefined,
        pais:      modal.data.pais      || undefined,
        provincia: modal.data.provincia || undefined,
      }
      const res = modal.data.id
        ? await updateCliente(modal.data.id, payload)
        : await createCliente(payload)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success(modal.data.id ? 'Cliente actualizado' : 'Cliente creado')
      setModal({ open:false, data: { ...EMPTY } })
      load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  async function handleToggle() {
    const item = confirm.item
    setConfirm(c => ({ ...c, open:false }))
    try {
      const res = item.activo ? await desactivarCliente(item.id) : await activarCliente(item.id)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success(item.activo ? 'Cliente desactivado' : 'Cliente activado')
      load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
  }

  const set  = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))
  const setF = k => e => setModal(m => ({ ...m, data: { ...m.data, [k]: e.target.value } }))

  return (
    <>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>Clientes</h1><p>Propietarios e inquilinos</p></div>
        <button className="btn btn-primary" onClick={openNew}><i className="bi bi-plus-lg" /> Cliente</button>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Buscar</label>
          <input className="filter-input" style={{ width:220 }} placeholder="Nombre, DNI, email..." value={filters.search} onChange={set('search')} />
        </div>
        <div className="filter-group">
          <label>Tipo</label>
          <select className="filter-input" value={filters.tipo} onChange={set('tipo')}>
            <option value="">Todos</option><option>Inquilino</option><option>Propietario</option>
          </select>
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
              <thead><tr>
                <th>DNI</th><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Tipo</th><th>Estado</th><th>Acciones</th>
              </tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={7}><EmptyState icon="bi-people" message="No hay clientes" /></td></tr>
                  : rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ color:'var(--tx-3)', fontSize:'.8rem' }}>{r.dni_cuit || '—'}</td>
                      <td><strong>{r.apellido ? `${r.apellido} ${r.nombre}` : r.nombre}</strong></td>
                      <td>{r.telefono || '—'}</td>
                      <td>{r.email || '—'}</td>
                      <td><span className={`badge badge-${r.tipo === 'Propietario' ? 'disponible' : 'alquiler'}`}>{r.tipo}</span></td>
                      <td><span className={`badge badge-${r.activo ? 'activo' : 'inactivo'}`}>{r.activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td><div className="table-actions">
                        <button className="btn btn-outline btn-sm btn-icon" title="Editar" onClick={() => openEdit(r)}><i className="bi bi-pencil" /></button>
                        <button className={`btn btn-sm btn-icon ${r.activo ? 'btn-warning' : 'btn-success'}`}
                          title={r.activo ? 'Desactivar' : 'Activar'}
                          onClick={() => setConfirm({ open:true, item:r })}>
                          <i className={`bi ${r.activo ? 'bi-person-x' : 'bi-person-check'}`} />
                        </button>
                      </div></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
        <Pagination total={total} page={page} limit={LIMIT} onPage={p => setPage(p)} />
      </div>

      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open:false }))}
        title={modal.data.id ? 'Editar cliente' : 'Nuevo cliente'}
        size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(m => ({ ...m, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size={14} /> : 'Guardar'}
          </button>
        </>}
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Apellido *</label>
            <input className="form-control" value={modal.data.apellido || ''} onChange={setF('apellido')} />
          </div>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input className="form-control" value={modal.data.nombre || ''} onChange={setF('nombre')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-select" value={modal.data.tipo || 'Inquilino'} onChange={setF('tipo')}>
              <option>Inquilino</option><option>Propietario</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">DNI</label>
            <input className="form-control" value={modal.data.dni_cuit || ''} onChange={setF('dni_cuit')} placeholder="20-12345678-9" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={modal.data.email || ''} onChange={setF('email')} />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className="form-control" value={modal.data.telefono || ''} onChange={setF('telefono')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Provincia</label>
            <input className="form-control" value={modal.data.provincia || ''} onChange={setF('provincia')} placeholder="Córdoba" />
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input className="form-control" value={modal.data.direccion || ''} onChange={setF('direccion')} placeholder="Av. Colón 1234" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open:false }))} onConfirm={handleToggle}
        title={confirm.item?.activo ? 'Desactivar cliente' : 'Activar cliente'}
        message={`¿${confirm.item?.activo ? 'Desactivar' : 'Activar'} a ${confirm.item?.apellido || ''} ${confirm.item?.nombre || ''}?`}
      />
    </>
  )
}
