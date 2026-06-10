import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { getPropiedades, createPropiedad, updatePropiedad, activarPropiedad, desactivarPropiedad, getGarantesProp, addGaranteProp, removeGaranteProp, listAdjuntosGarante, subirAdjuntoGarante, verAdjuntoGarante, elimAdjuntoGarante } from '../../api/propiedades'
import { getClientes } from '../../api/clientes'
import { getAgentes }  from '../../api/agentes'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

const EMPTY   = { tipo:'Casa', operacion:'Alquiler', direccion:'', ciudad:'', provincia:'', precio:'', moneda:'USD', superficie_m2:'', ambientes:'', propietario_id:'', agente_id:'' }
const EMPTY_G = { nombre:'', apellido:'', dni_cuit:'', telefono:'', email:'', direccion:'' }
const BADG    = { Disponible:'badge-disponible', Reservada:'badge-reservada', Alquilada:'badge-alquilada', Vendida:'badge-vendida' }

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
  const [confirm, setConfirm]   = useState({ open:false, item:null })
  const [garModal, setGarModal]   = useState({ open:false, item:null, list:[], newG: EMPTY_G })
  const [confirmGar, setConfirmGar] = useState({ open:false, garanteId:null })
  const [adjuntos, setAdjuntos]   = useState({})   // { garante_id: ['recibo','frente_dni',...] }
  const [adjLoading, setAdjLoading] = useState({}) // { 'garante_id-tipo': true }
  const [clientes, setClientes] = useState([])
  const [agentes,  setAgentes]  = useState([])
  const [habitaciones, setHabitaciones] = useState(EMPTY_HAB())
  const [formErrors, setFormErrors] = useState([])
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
    setFormErrors([])
    setModal({ open:true, data })
    const [rc, ra] = await Promise.all([
      getClientes({ limit:200, activo:'true', tipo:'Propietario' }),
      getAgentes({ limit:200, activo:'true' }),
    ])
    if (rc?.success) setClientes(rc.data.rows)
    if (ra?.success) setAgentes(ra.data.rows)
  }

  async function handleSave() {
    const errs = []
    if (!modal.data.propietario_id)        errs.push({ field:'propietario_id', msg:'El propietario es obligatorio' })
    if (!modal.data.direccion?.trim())     errs.push({ field:'direccion',      msg:'La dirección es obligatoria' })
    if (!modal.data.ciudad?.trim())        errs.push({ field:'ciudad',         msg:'La ciudad es obligatoria' })
    if (!modal.data.provincia?.trim())     errs.push({ field:'provincia',      msg:'La provincia es obligatoria' })
    if (!modal.data.precio || Number(modal.data.precio) <= 0) errs.push({ field:'precio', msg:'El precio es obligatorio' })
    if (errs.length) {
      setFormErrors(errs)
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        html: `<ul style="text-align:left;margin:0;padding-left:1.2rem;line-height:1.9">${errs.map(e => `<li>${e.msg}</li>`).join('')}</ul>`,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1e3a5f',
      })
      return
    }
    setFormErrors([])
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

  async function openGarantes(item) {
    setGarModal({ open:true, item, list:[], newG: { ...EMPTY_G } })
    setAdjuntos({})
    try {
      const res = await getGarantesProp(item.id)
      const list = res?.success ? res.data : []
      setGarModal(m => ({ ...m, list }))
      // cargar adjuntos de cada garante
      const map = {}
      await Promise.all(list.map(async g => {
        try {
          const r2 = await listAdjuntosGarante(item.id, g.id)
          map[g.id] = r2?.success ? r2.data.map(a => a.tipo) : []
        } catch { map[g.id] = [] }
      }))
      setAdjuntos(map)
    } catch { toast.error('No se pudieron cargar los garantes') }
  }

  async function handleSubirAdjunto(propId, garanteId, tipo, file) {
    if (!file) return
    const key = `${garanteId}-${tipo}`
    setAdjLoading(p => ({ ...p, [key]: true }))
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const res = await subirAdjuntoGarante(propId, garanteId, { tipo, nombre: file.name, mime_type: file.type, data: e.target.result })
          if (!res?.success) { toast.error(res?.message || 'Error al subir'); return }
          toast.success('Adjunto guardado')
          setAdjuntos(p => ({ ...p, [garanteId]: [...(p[garanteId]||[]).filter(t => t !== tipo), tipo] }))
        } catch { toast.error('Error al subir adjunto') }
        finally { setAdjLoading(p => ({ ...p, [key]: false })) }
      }
      reader.readAsDataURL(file)
    } catch { setAdjLoading(p => ({ ...p, [key]: false })) }
  }

  async function handleVerAdjunto(propId, garanteId, tipo) {
    try {
      const res = await verAdjuntoGarante(propId, garanteId, tipo)
      if (!res?.success) return
      const { data, mime_type, nombre } = res.data
      const w = window.open('', '_blank')
      if (mime_type?.startsWith('image/')) {
        w.document.write(`<!DOCTYPE html><html><head><title>${nombre||tipo}</title><style>body{margin:0;background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}</style></head><body><img src="${data}"></body></html>`)
      } else {
        w.document.write(`<!DOCTYPE html><html><head><title>${nombre||tipo}</title></head><body style="margin:0"><iframe src="${data}" style="width:100%;height:100vh;border:0"></iframe></body></html>`)
      }
      w.document.close()
    } catch { toast.error('No se pudo abrir el adjunto') }
  }

  async function handleElimAdjunto(propId, garanteId, tipo) {
    try {
      await elimAdjuntoGarante(propId, garanteId, tipo)
      setAdjuntos(p => ({ ...p, [garanteId]: (p[garanteId]||[]).filter(t => t !== tipo) }))
      toast.success('Adjunto eliminado')
    } catch { toast.error('Error al eliminar') }
  }

  async function handleAddGarante() {
    if (!garModal.newG.nombre?.trim()) { toast.error('El nombre es obligatorio'); return }
    try {
      const res = await addGaranteProp(garModal.item.id, garModal.newG)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('Garante agregado')
      const r2 = await getGarantesProp(garModal.item.id)
      setGarModal(m => ({ ...m, list: r2?.success ? r2.data : m.list, newG: { ...EMPTY_G } }))
    } catch(e) { toast.error(e?.message || 'Error') }
  }

  async function handleRemoveGarante() {
    const gid = confirmGar.garanteId
    setConfirmGar({ open:false, garanteId:null })
    try {
      await removeGaranteProp(garModal.item.id, gid)
      const r2 = await getGarantesProp(garModal.item.id)
      setGarModal(m => ({ ...m, list: r2?.success ? r2.data : m.list }))
      toast.success('Garante eliminado')
    } catch(e) { toast.error(e?.message || 'Error') }
  }

  const set  = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))
  const setF = k => e => {
    setModal(m => ({ ...m, data: { ...m.data, [k]: e.target.value } }))
    setFormErrors(errs => errs.filter(e => e.field !== k))
  }
  const hasErr = k => formErrors.some(e => e.field === k)
  const errCls = (base, k) => `${base}${hasErr(k) ? ' is-invalid' : ''}`

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
                        <button className="btn btn-outline btn-sm btn-icon" title="Garantes" onClick={() => openGarantes(r)}><i className="bi bi-people" /></button>
                        <button className="btn btn-outline btn-sm btn-icon" title="Editar" onClick={() => openModal({ ...r })}><i className="bi bi-pencil" /></button>
                        <button className={`btn btn-sm btn-icon ${r.activo ? 'btn-warning' : 'btn-success'}`} title={r.activo ? 'Desactivar' : 'Activar'} onClick={() => setConfirm({ open:true, item:r })}>
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

      <Modal open={modal.open} onClose={() => { setModal(m => ({ ...m, open:false })); setFormErrors([]) }} title={modal.data.id ? 'Editar propiedad' : 'Propiedad'} size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setModal(m => ({ ...m, open:false })); setFormErrors([]) }}>Cancelar</button>
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
        <div className="form-group"><label className="form-label">Dirección *</label><input className={errCls('form-control','direccion')} value={modal.data.direccion||''} onChange={setF('direccion')} /></div>
        <div className="form-row-3">
          <div className="form-group"><label className="form-label">Ciudad *</label><input className={errCls('form-control','ciudad')} value={modal.data.ciudad||''} onChange={setF('ciudad')} /></div>
          <div className="form-group"><label className="form-label">Provincia *</label><input className={errCls('form-control','provincia')} value={modal.data.provincia||''} onChange={setF('provincia')} /></div>
          <div className="form-group"><label className="form-label">Moneda</label>
            <select className="form-select" value={modal.data.moneda||'USD'} onChange={setF('moneda')}><option>USD</option><option>ARS</option></select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Precio *</label><input className={errCls('form-control','precio')} type="number" value={modal.data.precio||''} onChange={setF('precio')} /></div>
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
          <div className="form-group"><label className="form-label">Propietario *</label>
            <select className={errCls('form-select','propietario_id')} value={modal.data.propietario_id||''} onChange={setF('propietario_id')}>
              <option value="">Seleccioná un propietario</option>
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

      {/* Modal garantes */}
      <Modal open={garModal.open} onClose={() => { setGarModal(m => ({ ...m, open:false })); setAdjuntos({}) }} title={`Garantes — ${garModal.item?.direccion || ''}`} size="lg">
        <div style={{ marginBottom:'1rem' }}>
          <div className="section-title">Garantes ({garModal.list.length}/3)</div>
          {garModal.list.length === 0
            ? <p style={{ color:'var(--tx-4)', fontSize:'.8rem' }}>Sin garantes registrados.</p>
            : garModal.list.map(g => {
                const tiposAdj = adjuntos[g.id] || []
                const ADJ_LABELS = { recibo:'Recibo', frente_dni:'Frente DNI', dorso_dni:'Dorso DNI' }
                return (
                  <div key={g.id} style={{ border:'1px solid #e2e8f0', borderRadius:8, padding:'.75rem 1rem', marginBottom:'.75rem', background:'#f8fafc' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.5rem' }}>
                      <div>
                        <span style={{ fontWeight:600 }}>{g.apellido} {g.nombre||''}</span>
                        {g.dni_cuit && <span style={{ color:'var(--tx-4)', fontSize:'.8rem', marginLeft:8 }}>DNI {g.dni_cuit}</span>}
                        {g.telefono && <span style={{ color:'var(--tx-4)', fontSize:'.8rem', marginLeft:8 }}>{g.telefono}</span>}
                      </div>
                      <button className="btn btn-danger btn-sm btn-icon" title="Quitar garante" onClick={() => setConfirmGar({ open:true, garanteId:g.id })}><i className="bi bi-trash" /></button>
                    </div>
                    <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
                      {['recibo','frente_dni','dorso_dni'].map(tipo => {
                        const tiene = tiposAdj.includes(tipo)
                        const key   = `${g.id}-${tipo}`
                        const busy  = adjLoading[key]
                        return (
                          <div key={tipo} style={{ display:'flex', alignItems:'center', gap:'.25rem' }}>
                            <label style={{ cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'.3rem', padding:'.3rem .65rem', borderRadius:6, fontSize:'.78rem', fontWeight:500, border:`1px solid ${tiene ? '#86efac' : '#cbd5e1'}`, background: tiene ? '#f0fdf4' : '#fff', color: tiene ? '#15803d' : '#475569' }}>
                              {busy ? <Spinner size={11} /> : <i className={`bi ${tiene ? 'bi-check-circle-fill' : 'bi-upload'}`} />}
                              {ADJ_LABELS[tipo]}
                              <input type="file" accept="image/*,application/pdf" style={{ display:'none' }} onChange={e => { handleSubirAdjunto(garModal.item.id, g.id, tipo, e.target.files[0]); e.target.value='' }} />
                            </label>
                            {tiene && <>
                              <button className="btn btn-outline btn-sm btn-icon" title="Ver" style={{ padding:'3px 6px' }} onClick={() => handleVerAdjunto(garModal.item.id, g.id, tipo)}><i className="bi bi-eye" /></button>
                              <button className="btn btn-danger btn-sm btn-icon" title="Eliminar adjunto" style={{ padding:'3px 6px' }} onClick={() => handleElimAdjunto(garModal.item.id, g.id, tipo)}><i className="bi bi-x-lg" /></button>
                            </>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
          }
        </div>
        {garModal.list.length < 3 && <>
          <hr className="divider" />
          <div className="section-title">Agregar garante</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Nombre *</label><input className="form-control" value={garModal.newG.nombre||''} onChange={e => setGarModal(m => ({ ...m, newG: { ...m.newG, nombre: e.target.value } }))} /></div>
            <div className="form-group"><label className="form-label">Apellido</label><input className="form-control" value={garModal.newG.apellido||''} onChange={e => setGarModal(m => ({ ...m, newG: { ...m.newG, apellido: e.target.value } }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">DNI / CUIT</label><input className="form-control" value={garModal.newG.dni_cuit||''} onChange={e => setGarModal(m => ({ ...m, newG: { ...m.newG, dni_cuit: e.target.value } }))} /></div>
            <div className="form-group"><label className="form-label">Teléfono</label><input className="form-control" value={garModal.newG.telefono||''} onChange={e => setGarModal(m => ({ ...m, newG: { ...m.newG, telefono: e.target.value } }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={garModal.newG.email||''} onChange={e => setGarModal(m => ({ ...m, newG: { ...m.newG, email: e.target.value } }))} /></div>
            <div className="form-group"><label className="form-label">Dirección</label><input className="form-control" value={garModal.newG.direccion||''} onChange={e => setGarModal(m => ({ ...m, newG: { ...m.newG, direccion: e.target.value } }))} /></div>
          </div>
          <button className="btn btn-primary" onClick={handleAddGarante}><i className="bi bi-plus-lg" /> Agregar</button>
        </>}
      </Modal>

      <ConfirmDialog open={confirmGar.open} onClose={() => setConfirmGar({ open:false, garanteId:null })} onConfirm={handleRemoveGarante}
        title="Quitar garante" message="¿Eliminar este garante de la propiedad?" />
    </>
  )
}
