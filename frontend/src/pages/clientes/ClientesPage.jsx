import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getClientes, createCliente, updateCliente, activarCliente, desactivarCliente } from '../../api/clientes'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

const EMPTY = {
  tipo:'Persona', dni_cuit:'', nombre:'', apellido:'',
  razon_social:'', descripcion:'', pais:'Argentina', provincia:'',
  presupuesto:'', moneda:'ARS', email:'', telefono:'', direccion:''
}

const DESCRIPCIONES = ['Inquilino','Propietario','Comprador','Vendedor','Inversor','Garante','Otro']

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
  function openEdit(r) { setModal({ open:true, data: { ...r, presupuesto: r.presupuesto ?? '' } }) }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...modal.data,
        presupuesto:  modal.data.presupuesto !== '' ? Number(modal.data.presupuesto) : null,
        razon_social: modal.data.razon_social || undefined,
        descripcion:  modal.data.descripcion  || undefined,
        provincia:    modal.data.provincia     || undefined,
        apellido:     modal.data.apellido      || undefined,
      }
      const res = modal.data.id
        ? await updateCliente(modal.data.id, payload)
        : await createCliente(payload)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success(modal.data.id ? 'Cliente actualizado' : 'Cliente creado')
      setModal(m => ({ ...m, open:false }))
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

  const esEmpresa = modal.data.tipo === 'Empresa'

  return (
    <>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>Clientes</h1><p>Propietarios, inquilinos y compradores</p></div>
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
            <option value="">Todos</option><option>Persona</option><option>Empresa</option>
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
                <th>DNI / CUIT</th><th>Nombre / Raz�n Social</th><th>Descripci�n</th><th>Tel�fono</th><th>Email</th><th>Tipo</th><th>Estado</th><th>Acciones</th>
              </tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={7}><EmptyState icon="bi-people" message="No hay clientes" /></td></tr>
                  : rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ color:'var(--tx-3)', fontSize:'.8rem' }}>{r.dni_cuit || '�'}</td>
                      <td>
                        <strong>{r.razon_social || (r.nombre + (r.apellido ? ' ' + r.apellido : ''))}</strong>
                      </td>
                      <td style={{ color:'var(--tx-3)', fontSize:'.8rem' }}>{r.descripcion || '�'}</td>
                      <td>{r.telefono || '�'}</td>
                      <td>{r.email || '�'}</td>
                      <td><span className={`badge badge-${r.tipo?.toLowerCase()}`}>{r.tipo}</span></td>
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
        title={modal.data.id ? 'Editar cliente' : 'Cliente'}
        size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(m => ({ ...m, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size={14} /> : 'Guardar'}
          </button>
        </>}
      >
        {/* DNI primero */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{esEmpresa ? 'CUIT' : 'DNI'}</label>
            <input className="form-control" value={modal.data.dni_cuit || ''} onChange={setF('dni_cuit')}
              placeholder={esEmpresa ? '30-12345678-9' : '20-12345678-9'} />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-select" value={modal.data.tipo || 'Persona'} onChange={setF('tipo')}>
              <option>Persona</option><option>Empresa</option>
            </select>
          </div>
        </div>

        {esEmpresa && (
          <div className="form-group">
            <label className="form-label">Raz�n Social</label>
            <input className="form-control" value={modal.data.razon_social || ''} onChange={setF('razon_social')} placeholder="Nombre de la empresa" />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Apellido</label>
            <input className="form-control" value={modal.data.apellido || ''} onChange={setF('apellido')} />
          </div>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input className="form-control" value={modal.data.nombre || ''} onChange={setF('nombre')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Descripci�n</label>
            <select className="form-select" value={modal.data.descripcion || ''} onChange={setF('descripcion')}>
              <option value="">� Sin especificar �</option>
              {DESCRIPCIONES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Pa�s</label>
            <input className="form-control" value={modal.data.pais || ''} onChange={setF('pais')} placeholder="Argentina" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Provincia</label>
            <input className="form-control" value={modal.data.provincia || ''} onChange={setF('provincia')} placeholder="C�rdoba" />
          </div>
          <div className="form-group">
            <label className="form-label">Direcci�n</label>
            <input className="form-control" value={modal.data.direccion || ''} onChange={setF('direccion')} placeholder="Av. Col�n 1234" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Presupuesto</label>
            <input className="form-control" type="number" min="0" step="0.01"
              value={modal.data.presupuesto ?? ''} onChange={setF('presupuesto')} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Moneda</label>
            <select className="form-select" value={modal.data.moneda || 'ARS'} onChange={setF('moneda')}>
              <option value="ARS">ARS � Peso</option>
              <option value="USD">USD � D�lar</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={modal.data.email || ''} onChange={setF('email')} />
          </div>
          <div className="form-group">
            <label className="form-label">Tel�fono</label>
            <input className="form-control" value={modal.data.telefono || ''} onChange={setF('telefono')} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open:false }))} onConfirm={handleToggle}
        title={confirm.item?.activo ? 'Desactivar cliente' : 'Activar cliente'}
        message={`�${confirm.item?.activo ? 'Desactivar' : 'Activar'} a ${confirm.item?.nombre} ${confirm.item?.apellido || ''}?`}
      />
    </>
  )
}

