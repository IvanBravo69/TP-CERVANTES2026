import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getRoles, createRol, getPermisos, getPermisosDeRol, asignarPermisos } from '../../api/roles'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

export default function RolesPage() {
  const [roles, setRoles]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [nuevoModal, setNuevoModal] = useState({ open:false, nombre:'', descripcion:'' })
  const [permModal, setPermModal]   = useState({ open:false, rol:null, todos:[], asignados:new Set(), saving:false })

  async function load() {
    setLoading(true)
    try {
      const res = await getRoles()
      if (res?.success) setRoles(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCrear() {
    if (!nuevoModal.nombre.trim()) { toast.error('El nombre es requerido'); return }
    try {
      const res = await createRol({ nombre: nuevoModal.nombre, descripcion: nuevoModal.descripcion })
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('Rol creado')
      setNuevoModal({ open:false, nombre:'', descripcion:'' }); load()
    } catch(e) { toast.error(e?.message || 'Error') }
  }

  async function openPermisos(rol) {
    const [rt, ra] = await Promise.all([getPermisos(), getPermisosDeRol(rol.id)])
    if (!rt?.success) { toast.error('Error cargando permisos'); return }
    const asignados = new Set((ra?.data || []).map(p => p.id))
    setPermModal({ open:true, rol, todos: rt.data, asignados, saving:false })
  }

  async function handleGuardarPermisos() {
    setPermModal(p => ({ ...p, saving:true }))
    try {
      const res = await asignarPermisos(permModal.rol.id, [...permModal.asignados])
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('Permisos actualizados')
      setPermModal(p => ({ ...p, open:false }))
    } catch(e) { toast.error(e?.message || 'Error') }
    finally { setPermModal(p => ({ ...p, saving:false })) }
  }

  function togglePerm(id) {
    setPermModal(p => {
      const s = new Set(p.asignados)
      s.has(id) ? s.delete(id) : s.add(id)
      return { ...p, asignados: s }
    })
  }

  const groupedPerms = permModal.todos.reduce((acc, p) => {
    const prefix = p.nombre.split('_')[0]
    if (!acc[prefix]) acc[prefix] = []
    acc[prefix].push(p)
    return acc
  }, {})

  return (
    <>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>Roles y Permisos</h1><p>Control de acceso por rol</p></div>
        <button className="btn btn-primary" onClick={() => setNuevoModal({ open:true, nombre:'', descripcion:'' })}>
          <i className="bi bi-plus-lg" /> Rol
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? <div style={{ textAlign:'center', padding:'3rem' }}><Spinner /></div> : (
            <table>
              <thead><tr><th>Rol</th><th>Descripción</th><th>Acciones</th></tr></thead>
              <tbody>
                {roles.length === 0
                  ? <tr><td colSpan={3}><EmptyState icon="bi-shield" message="No hay roles" /></td></tr>
                  : roles.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.nombre}</strong></td>
                      <td style={{ color:'var(--tx-3)' }}>{r.descripcion || '—'}</td>
                      <td><div className="table-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => openPermisos(r)}>
                          <i className="bi bi-shield-check" /> Permisos
                        </button>
                      </div></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={nuevoModal.open} onClose={() => setNuevoModal(n => ({ ...n, open:false }))} title="Rol"
        footer={<>
          <button className="btn btn-outline" onClick={() => setNuevoModal(n => ({ ...n, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleCrear}>Crear rol</button>
        </>}
      >
        <div className="form-group"><label className="form-label">Nombre *</label>
          <input className="form-control" value={nuevoModal.nombre}
            onChange={e => setNuevoModal(n => ({ ...n, nombre: e.target.value }))} />
        </div>
        <div className="form-group"><label className="form-label">Descripción</label>
          <input className="form-control" value={nuevoModal.descripcion}
            onChange={e => setNuevoModal(n => ({ ...n, descripcion: e.target.value }))} />
        </div>
      </Modal>

      <Modal open={permModal.open} onClose={() => setPermModal(p => ({ ...p, open:false }))}
        title={`Permisos — ${permModal.rol?.nombre}`} size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => setPermModal(p => ({ ...p, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleGuardarPermisos} disabled={permModal.saving}>
            {permModal.saving ? <Spinner size={14} /> : 'Guardar permisos'}
          </button>
        </>}
      >
        {Object.entries(groupedPerms).map(([grupo, perms]) => (
          <div key={grupo} style={{ marginBottom:'1rem' }}>
            <div style={{ fontSize:'.75rem', fontWeight:700, textTransform:'uppercase', color:'var(--tx-3)', letterSpacing:'.05em', marginBottom:'.4rem' }}>
              {grupo}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'.5rem' }}>
              {perms.map(p => (
                <label key={p.id} style={{ display:'flex', alignItems:'center', gap:'.4rem', cursor:'pointer',
                  padding:'.35rem .75rem', border:'1px solid var(--border)', borderRadius:6,
                  background: permModal.asignados.has(p.id) ? 'var(--primary)' : 'var(--sb-bg)',
                  color: permModal.asignados.has(p.id) ? '#fff' : 'var(--tx-2)',
                  fontSize:'.8rem', transition:'all .15s' }}>
                  <input type="checkbox" style={{ display:'none' }}
                    checked={permModal.asignados.has(p.id)}
                    onChange={() => togglePerm(p.id)} />
                  {p.nombre}
                </label>
              ))}
            </div>
          </div>
        ))}
      </Modal>
    </>
  )
}
