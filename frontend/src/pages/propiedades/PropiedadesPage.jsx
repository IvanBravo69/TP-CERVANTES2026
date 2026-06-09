import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getPropiedades, createPropiedad, updatePropiedad, activarPropiedad, desactivarPropiedad } from '../../api/propiedades'
import { getClientes } from '../../api/clientes'
import { getAgentes }  from '../../api/agentes'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

const EMPTY = { tipo:'Casa', operacion:'Alquiler', direccion:'', ciudad:'', provincia:'', precio:'', moneda:'USD', superficie_m2:'', ambientes:'', propietario_id:'', agente_id:'' }
const BADG  = { Disponible:'badge-disponible', Reservada:'badge-reservada', Alquilada:'badge-alquilada', Vendida:'badge-vendida' }

// Dormitorios determinan el conteo de ambientes (arg: dorm+1, o monoambiente si dorm=0)
// Los extras son informativos (no cuentan como ambiente)
const HAB_EXTRAS = [
  { key:'Banio',   icon:'bi-droplet',   label:'Baño' },
  { key:'Cochera', icon:'bi-car-front', label:'Cochera' },
]
const EMPTY_HAB = () => ({ dormitorios: 0, ...Object.fromEntries(HAB_EXTRAS.map(h => [h.key, 0])) })

function calcAmbientes(dorm) {
  if (dorm === 0) return 1 // Monoambiente
  return dorm + 1          // N dorm + living/comedor
}
function labelAmbientes(dorm) {
  if (dorm === 0) return 'Monoambiente'
  return `${calcAmbientes(dorm)} ambientes`
}

export default function PropiedadesPage() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ tipo:'', operacion:'', estado:'', ciudad:'' })
  const [modal, setModal]     = useState({ open:false, data: EMPTY })
  const [saving, setSaving]   = useState(false)
  const [confirm, setConfirm] = useState({ open:false, item:null })
  const [clientes, setClientes] = useState([])
  const [agentes,  setAgentes]  = useState([])
  const [habitaciones, setHabitaciones] = useState(EMPTY_HAB())
  const LIMIT = 20

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '')) }
      const res = await getPropiedades(params)
      if (res?.success) { setRows(res.data.rows); setTotal(res.data.total) }
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load(page) }, [page])
  useEffect(() => { setPage(1); load(1) }, [filters])

  async function openModal(data = { ...EMPTY }) {
    const h = EMPTY_HAB()
    if (data.ambientes) {
      const amb = Number(data.ambientes)
      h.dormitorios = amb <= 1 ? 0 : amb - 1
    }
    setHabitaciones(h)
    setModal({ open:true, data })
    const [rc, ra] = await Promise.all([
      getClientes({ limit:200, activo:'true', tipo:'Propietario' }),
      getAgentes({ limit:200, activo:'true' }),
    ])
    if (rc?.success) setClientes(rc.data.rows)
    if (ra?.success) setAgentes(ra.data.rows)
  }

  async function handleSave() {
    if (!modal.data.direccion?.trim()) { toast.error('La dirección es obligatoria'); return }
    if (!modal.data.ciudad?.trim())    { toast.error('La ciudad es obligatoria');    return }
    if (!modal.data.precio)            { toast.error('El precio es obligatorio');    return }
    setSaving(true)
    try {
      const ambientes = calcAmbientes(habitaciones.dormitorios)
      const payload = { ...modal.data, precio: Number(modal.data.precio), superficie_m2: modal.data.superficie_m2 ? Number(modal.data.superficie_m2) : null, ambientes, propietario_id: modal.data.propietario_id || null, agente_id: modal.data.agente_id || null }
      const res = modal.data.id ? await updatePropiedad(modal.data.id, payload) : await createPropiedad(payload)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success(modal.data.id ? 'Propiedad actualizada' : 'Propiedad creada')
      setModal(m => ({ ...m, open:false })); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  async function handleToggle() {
    const item = confirm.item
    setConfirm(c => ({ ...c, open:false }))
    try {
      const res = item.activo ? await desactivarPropiedad(item.id) : await activarPropiedad(item.id)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('Estado actualizado'); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
  }

  const set  = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))
  const setF = k => e => setModal(m => ({ ...m, data: { ...m.data, [k]: e.target.value } }))

  return (
    <>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>Propiedades</h1><p>Catálogo de inmuebles</p></div>
        <button className="btn btn-primary" onClick={() => openModal()}><i className="bi bi-plus-lg" /> Propiedad</button>
      </div>

      <div className="filters-bar">
        {[
          { k:'tipo',     label:'Tipo',      opts:['','Casa','Departamento','Local','Terreno','Oficina','Otro'] },
          { k:'operacion',label:'Operación', opts:['','Alquiler'] },
          { k:'estado',   label:'Estado',    opts:['','Disponible','Reservada','Vendida','Alquilada'] },
        ].map(({ k, label, opts }) => (
          <div key={k} className="filter-group">
            <label>{label}</label>
            <select className="filter-input" value={filters[k]} onChange={set(k)}>
              {opts.map(o => <option key={o} value={o}>{o || 'Todos'}</option>)}
            </select>
          </div>
        ))}
        <div className="filter-group">
          <label>Ciudad</label>
          <input className="filter-input" style={{ width:140 }} placeholder="Ciudad..." value={filters.ciudad} onChange={set('ciudad')} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? <div style={{ textAlign:'center', padding:'3rem' }}><Spinner /></div> : (
            <table>
              <thead><tr><th>Dirección</th><th>Tipo</th><th>Operación</th><th>Ciudad</th><th>Precio</th><th>Estado</th><th>Agente</th><th>Acciones</th></tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={8}><EmptyState icon="bi-building" message="No hay propiedades" /></td></tr>
                  : rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.direccion}</td>
                      <td>{r.tipo}</td>
                      <td><span className={`badge badge-${r.operacion === 'Venta' ? 'venta' : 'alquiler'}`}>{r.operacion}</span></td>
                      <td>{r.ciudad}</td>
                      <td style={{ fontWeight:600 }}>{r.moneda} {Number(r.precio).toLocaleString('es-AR')}</td>
                      <td><span className={`badge ${BADG[r.estado] || ''}`}>{r.estado}</span></td>
                      <td>{r.agente_nombre ? `${r.agente_nombre} ${r.agente_apellido||''}` : '—'}</td>
                      <td><div className="table-actions">
                        <button className="btn btn-outline btn-sm btn-icon" onClick={() => openModal({ ...r })}><i className="bi bi-pencil" /></button>
                        <button className={`btn btn-sm btn-icon ${r.activo ? 'btn-warning' : 'btn-success'}`} onClick={() => setConfirm({ open:true, item:r })}>
                          <i className={`bi ${r.activo ? 'bi-eye-slash' : 'bi-eye'}`} /></button>
                      </div></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination total={total} page={page} limit={LIMIT} onPage={setPage} />
      </div>

      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open:false }))} title={modal.data.id ? 'Editar propiedad' : 'Propiedad'} size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(m => ({ ...m, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size={14} /> : 'Guardar'}</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group"><label className="form-label">Tipo *</label>
            <select className="form-select" value={modal.data.tipo||'Casa'} onChange={setF('tipo')}>
              {['Casa','Departamento','Local','Terreno','Oficina','Otro'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Operación</label>
            <input className="form-control" value="Alquiler" readOnly style={{ background:'#f8fafc', color:'var(--tx-3)' }} />
          </div>
        </div>
        <div className="form-group"><label className="form-label">Dirección *</label><input className="form-control" value={modal.data.direccion||''} onChange={setF('direccion')} /></div>
        <div className="form-row-3">
          <div className="form-group"><label className="form-label">Ciudad *</label><input className="form-control" value={modal.data.ciudad||''} onChange={setF('ciudad')} /></div>
          <div className="form-group"><label className="form-label">Provincia *</label><input className="form-control" value={modal.data.provincia||''} onChange={setF('provincia')} /></div>
          <div className="form-group"><label className="form-label">Moneda</label>
            <select className="form-select" value={modal.data.moneda||'USD'} onChange={setF('moneda')}><option>USD</option><option>ARS</option></select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Precio *</label><input className="form-control" type="number" value={modal.data.precio||''} onChange={setF('precio')} /></div>
          <div className="form-group"><label className="form-label">Superficie m²</label><input className="form-control" type="number" value={modal.data.superficie_m2||''} onChange={setF('superficie_m2')} /></div>
        </div>
        <div className="form-group">
          <label className="form-label">Ambientes</label>

          {/* Dormitorios — determinan el conteo */}
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'.75rem 1rem', marginBottom:'.625rem' }}>
            <i className="bi bi-moon-stars" style={{ color:'#1d4ed8', fontSize:'1.1rem' }} />
            <span style={{ fontWeight:600, fontSize:'.875rem', flex:1 }}>Dormitorios</span>
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
              <button type="button" style={{ width:28, height:28, borderRadius:6, border:'1px solid #93c5fd', background:'#fff', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}
                onClick={() => setHabitaciones(p => ({ ...p, dormitorios: Math.max(0, p.dormitorios-1) }))}>−</button>
              <span style={{ fontSize:'.95rem', fontWeight:700, minWidth:20, textAlign:'center' }}>{habitaciones.dormitorios}</span>
              <button type="button" style={{ width:28, height:28, borderRadius:6, border:'1px solid #93c5fd', background:'#fff', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}
                onClick={() => setHabitaciones(p => ({ ...p, dormitorios: p.dormitorios+1 }))}>+</button>
            </div>
            <span style={{ background:'#1d4ed8', color:'#fff', borderRadius:6, padding:'.2rem .6rem', fontSize:'.78rem', fontWeight:700, marginLeft:'.5rem' }}>
              {labelAmbientes(habitaciones.dormitorios)}
            </span>
          </div>

          {/* Extras — informativos, no cuentan como ambiente */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.4rem' }}>
            {HAB_EXTRAS.map(h => (
              <div key={h.key} style={{ border:'1px solid #e2e8f0', borderRadius:7, padding:'.4rem .5rem', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8fafc' }}>
                <span style={{ fontSize:'.72rem', fontWeight:500, display:'flex', alignItems:'center', gap:'.25rem', color:'#475569' }}>
                  <i className={`bi ${h.icon}`} />{h.label}
                </span>
                <div style={{ display:'flex', alignItems:'center', gap:'.2rem' }}>
                  <button type="button" style={{ width:20, height:20, borderRadius:4, border:'1px solid #cbd5e1', background:'#fff', cursor:'pointer', fontSize:'.8rem', display:'flex', alignItems:'center', justifyContent:'center' }}
                    onClick={() => setHabitaciones(p => ({ ...p, [h.key]: Math.max(0, p[h.key]-1) }))}>−</button>
                  <span style={{ fontSize:'.78rem', fontWeight:600, minWidth:14, textAlign:'center' }}>{habitaciones[h.key]}</span>
                  <button type="button" style={{ width:20, height:20, borderRadius:4, border:'1px solid #cbd5e1', background:'#fff', cursor:'pointer', fontSize:'.8rem', display:'flex', alignItems:'center', justifyContent:'center' }}
                    onClick={() => setHabitaciones(p => ({ ...p, [h.key]: p[h.key]+1 }))}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div style={{ display:'none' }} />
          <div className="form-group"><label className="form-label">Propietario</label>
            <select className="form-select" value={modal.data.propietario_id||''} onChange={setF('propietario_id')}>
              <option value="">Sin propietario</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.apellido} {c.nombre||''}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Agente asignado</label>
          <select className="form-select" value={modal.data.agente_id||''} onChange={setF('agente_id')}>
            <option value="">Sin agente</option>
            {agentes.map(a => <option key={a.id} value={a.id}>{a.apellido} {a.nombre}</option>)}
          </select>
        </div>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open:false }))} onConfirm={handleToggle}
        title={confirm.item?.activo ? 'Desactivar propiedad' : 'Activar propiedad'}
        message={`¿${confirm.item?.activo ? 'Desactivar' : 'Activar'} la propiedad en ${confirm.item?.direccion}?`}
      />
    </>
  )
}
