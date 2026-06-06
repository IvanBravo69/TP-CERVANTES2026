import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getUsuarios, createUsuario, updateUsuario, activarUsuario, desactivarUsuario } from '../../api/usuarios'
import { getRoles } from '../../api/roles'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

const EMPTY = { username:'', full_name:'', email:'', password:'', role_id:'' }

export default function UsuariosPage() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ search:'', activo:'' })
  const [modal, setModal]     = useState({ open:false, data: EMPTY })
  const [saving, setSaving]   = useState(false)
  const [confirm, setConfirm] = useState({ open:false, item:null })
  const [roles, setRoles]     = useState([])
  const LIMIT = 20

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '')) }
      const res = await getUsuarios(params)
      if (res?.success) { setRows(res.data.rows); setTotal(res.data.total) }
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load(page) }, [page])
  useEffect(() => { setPage(1); load(1) }, [filters])

  async function openModal(data = { ...EMPTY }) {
    const rr = await getRoles()
    if (rr?.success) setRoles(rr.data)
    setModal({ open:true, data })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { ...modal.data }
      if (modal.data.id && !payload.password) delete payload.password
      const res = modal.data.id ? await updateUsuario(modal.data.id, payload) : await createUsuario(payload)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success(modal.data.id ? 'Usuario actualizado' : 'Usuario creado')
      setModal(m => ({ ...m, open:false })); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  async function handleToggle() {
    const item = confirm.item
    setConfirm(c => ({ ...c, open:false }))
    try {
      const res = item.activo ? await desactivarUsuario(item.id) : await activarUsuario(item.id)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success(item.activo ? 'Usuario desactivado' : 'Usuario activado'); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
  }

  const set  = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))
  const setF = k => e => setModal(m => ({ ...m, data: { ...m.data, [k]: e.target.value } }))

  return (
    <>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>Usuarios</h1><p>Cuentas de acceso al sistema</p></div>
        <button className="btn btn-primary" onClick={() => openModal()}><i className="bi bi-plus-lg" /> Usuario</button>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Buscar</label>
          <input className="filter-input" style={{ width:220 }} placeholder="Usuario, nombre, email..." value={filters.search} onChange={set('search')} />
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
              <thead><tr><th>Usuario</th><th>Nombre completo</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={6}><EmptyState icon="bi-person-badge" message="No hay usuarios" /></td></tr>
                  : rows.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.username}</strong></td>
                      <td>{r.full_name || '—'}</td>
                      <td>{r.email || '—'}</td>
                      <td><span className="badge" style={{ background:'#eff6ff', color:'#1d4ed8' }}>{r.role_nombre || '—'}</span></td>
                      <td><span className={`badge badge-${r.activo ? 'activo' : 'inactivo'}`}>{r.activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td><div className="table-actions">
                        <button className="btn btn-outline btn-sm btn-icon" title="Editar" onClick={() => openModal({ ...r, password:'' })}>
                          <i className="bi bi-pencil" /></button>
                        <button className={`btn btn-sm btn-icon ${r.activo ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => setConfirm({ open:true, item:r })}>
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

      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open:false }))} title={modal.data.id ? 'Editar usuario' : 'Usuario'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(m => ({ ...m, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size={14} /> : 'Guardar'}</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group"><label className="form-label">Usuario *</label>
            <input className="form-control" value={modal.data.username||''} onChange={setF('username')} autoComplete="off" />
          </div>
          <div className="form-group"><label className="form-label">Nombre completo</label>
            <input className="form-control" value={modal.data.full_name||''} onChange={setF('full_name')} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Email</label>
            <input className="form-control" type="email" value={modal.data.email||''} onChange={setF('email')} />
          </div>
          <div className="form-group"><label className="form-label">Rol *</label>
            <select className="form-select" value={modal.data.role_id||''} onChange={setF('role_id')}>
              <option value="">Seleccionar...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{modal.data.id ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
          <input className="form-control" type="password" value={modal.data.password||''} onChange={setF('password')} autoComplete="new-password" />
        </div>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open:false }))} onConfirm={handleToggle}
        title={confirm.item?.activo ? 'Desactivar usuario' : 'Activar usuario'}
        message={`¿${confirm.item?.activo ? 'Desactivar' : 'Activar'} al usuario "${confirm.item?.username}"?`}
      />
    </>
  )
}
