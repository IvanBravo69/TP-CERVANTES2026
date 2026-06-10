import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getContratos, createContrato, updateContrato, cambiarEstado, renovarContrato, getGarantes, addGarante, removeGarante } from '../../api/contratos'
import { getPagosByContrato } from '../../api/finanzas'
import { getPropiedades, getGarantesProp } from '../../api/propiedades'
import { getClientes }    from '../../api/clientes'
import { getAgentes }     from '../../api/agentes'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

const EMPTY_C = { tipo:'Alquiler', propiedad_id:'', cliente_id:'', agente_id:'', fecha_inicio:'', fecha_fin:'', monto:'', moneda:'ARS' }
const EMPTY_G = { nombre:'', apellido:'', dni_cuit:'', telefono:'', email:'', direccion:'' }
const EMPTY_R = { nueva_fecha_fin:'', nuevo_monto:'', nueva_moneda:'', observaciones:'' }
const BADG_E  = { Activo:'badge-activo', Finalizado:'badge-vendida', Cancelado:'badge-inactivo' }

export default function ContratosPage() {
  const [rows, setRows]         = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [filters, setFilters]   = useState({ estado:'', search:'' })
  const [modal, setModal]       = useState({ open:false, data: EMPTY_C })
  const [saving, setSaving]     = useState(false)
  const [estModal, setEstModal] = useState({ open:false, item:null, estado:'' })
  const [renModal, setRenModal] = useState({ open:false, item:null, data: EMPTY_R })
  const [garModal, setGarModal] = useState({ open:false, item:null, list:[], newG: EMPTY_G })
  const [confirm, setConfirm]   = useState({ open:false, garanteId:null })
  const [histModal, setHistModal] = useState({ open:false, item:null, rows:[], loading:false })
  const [propList,     setPropList]     = useState([])
  const [cliList,      setCliList]      = useState([])
  const [agList,       setAgList]       = useState([])
  const [propGarantes, setPropGarantes] = useState([])
  const LIMIT = 20

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '')) }
      const res = await getContratos(params)
      if (res?.success) { setRows(res.data.rows); setTotal(res.data.total) }
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load(page) }, [page])
  useEffect(() => { setPage(1); load(1) }, [filters])

  async function openModal(data = { ...EMPTY_C }) {
    const [rp, rc, ra] = await Promise.all([
      getPropiedades({ limit:200, activo:'true', estado:'Disponible' }),
      getClientes({ limit:200, activo:'true', tipo:'Inquilino' }),
      getAgentes({ limit:200, activo:'true' }),
    ])
    if (rp?.success) setPropList(rp.data.rows)
    if (rc?.success) setCliList(rc.data.rows)
    if (ra?.success) setAgList(ra.data.rows)
    setModal({ open:true, data })
  }

  async function handleSave() {
    if (!modal.data.propiedad_id) { toast.error('Seleccioná una propiedad'); return }
    if (!modal.data.cliente_id)   { toast.error('Seleccioná un inquilino');  return }
    if (!modal.data.fecha_inicio) { toast.error('La fecha de inicio es obligatoria'); return }
    if (!modal.data.monto)        { toast.error('El monto es obligatorio');  return }
    setSaving(true)
    try {
      const d = { ...modal.data, monto: Number(modal.data.monto), propiedad_id: Number(modal.data.propiedad_id), cliente_id: Number(modal.data.cliente_id), agente_id: modal.data.agente_id ? Number(modal.data.agente_id) : null, fecha_fin: modal.data.fecha_fin || null }
      const res = modal.data.id ? await updateContrato(modal.data.id, d) : await createContrato(d)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success(modal.data.id ? 'Contrato actualizado' : 'Contrato creado')
      setModal({ open:false, data: { ...EMPTY_C } }); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  async function handleGenerar() {
    const d = modal.data
    if (!d.propiedad_id || !d.cliente_id || !d.fecha_inicio || !d.monto) {
      toast.error('Completá los campos requeridos'); return
    }
    setSaving(true)
    try {
      const payload = { ...d, tipo:'Alquiler', monto: Number(d.monto), propiedad_id: Number(d.propiedad_id), cliente_id: Number(d.cliente_id), agente_id: d.agente_id ? Number(d.agente_id) : null, fecha_fin: d.fecha_fin || null }
      const res = await createContrato(payload)
      if (!res?.success) { toast.error(res?.message || 'Error al guardar'); return }
      toast.success('Contrato guardado')
      setModal({ open:false, data: { ...EMPTY_C } })
      load(page)
    } catch(e) { toast.error(e?.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function openHistorial(item) {
    setHistModal({ open:true, item, rows:[], loading:true })
    try {
      const res = await getPagosByContrato(item.id)
      setHistModal(m => ({ ...m, rows: res?.success ? (res.data?.pagos || []) : [], loading:false }))
    } catch { setHistModal(m => ({ ...m, loading:false })) }
  }

  async function handleCambiarEstado() {
    setSaving(true)
    try {
      const res = await cambiarEstado(estModal.item.id, estModal.estado)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('Estado actualizado')
      setEstModal(m => ({ ...m, open:false })); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  async function handleRenovar() {
    setSaving(true)
    try {
      const d = { ...renModal.data, nuevo_monto: renModal.data.nuevo_monto ? Number(renModal.data.nuevo_monto) : undefined }
      const res = await renovarContrato(renModal.item.id, d)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('Contrato renovado — nuevo contrato #' + res.data.id)
      setRenModal(m => ({ ...m, open:false })); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  async function openGarantes(item) {
    const res = await getGarantes(item.id)
    setGarModal({ open:true, item, list: res?.success ? res.data : [], newG: { ...EMPTY_G } })
  }

  async function handleAddGarante() {
    try {
      const res = await addGarante(garModal.item.id, garModal.newG)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success('Garante agregado')
      const r2 = await getGarantes(garModal.item.id)
      setGarModal(m => ({ ...m, list: r2?.success ? r2.data : m.list, newG: { ...EMPTY_G } }))
    } catch(e) { toast.error(e?.message || 'Error') }
  }

  async function handleRemoveGarante() {
    const gid = confirm.garanteId
    setConfirm({ open:false, garanteId:null })
    try {
      await removeGarante(garModal.item.id, gid)
      const r2 = await getGarantes(garModal.item.id)
      setGarModal(m => ({ ...m, list: r2?.success ? r2.data : m.list }))
      toast.success('Garante eliminado')
    } catch(e) { toast.error(e?.message || 'Error') }
  }

  async function handlePrint(r) {
    let garantes = []
    try {
      const res = await getGarantes(r.id)
      if (res?.success) garantes = res.data
    } catch { /* sin garantes */ }

    const toDate = s => s ? new Date(String(s).slice(0,10) + 'T12:00:00') : null
    const fmtD = s => { const d = toDate(s); return d ? d.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—' }
    const fmtM = n => Number(n).toLocaleString('es-AR', { minimumFractionDigits:2 })

    const hoy = new Date()
    const hoyStr = `${String(hoy.getDate()).padStart(2,'0')} / ${String(hoy.getMonth()+1).padStart(2,'0')} / ${hoy.getFullYear()}`

    let meses = 24
    const fiD = toDate(r.fecha_inicio)
    const ffD = toDate(r.fecha_fin)
    if (fiD && ffD) {
      meses = (ffD.getFullYear() - fiD.getFullYear()) * 12 + (ffD.getMonth() - fiD.getMonth())
    }
    const mensual = meses > 0 ? Number(r.monto) / meses : Number(r.monto)

    const fi   = fiD || hoy
    const dia  = fi.getDate()
    const mes  = fi.toLocaleDateString('es-AR', { month:'long' })
    const anio = fi.getFullYear()

    const propietario = r.propietario_apellido
      ? `${r.propietario_apellido}${r.propietario_nombre ? ', ' + r.propietario_nombre : ''}`
      : '_______________'
    const propDni = r.propietario_dni || '_______________'
    const inquilino = `${r.cliente_apellido || ''}${r.cliente_nombre ? ', ' + r.cliente_nombre : ''}`
    const inqDni  = r.cliente_dni || '_______________'
    const ciudad  = r.propiedad_ciudad || 'Córdoba'
    const prov    = r.propiedad_provincia || 'Córdoba'

    const doc = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Contrato de Locación #${r.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,serif;font-size:11.5pt;color:#111;padding:48px 64px;line-height:1.8}
.header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}
h1{font-size:14pt;text-transform:uppercase;letter-spacing:.08em;font-weight:bold}
.fecha-label{font-size:11pt}
.subtitulo{font-style:italic;margin-bottom:28px;font-size:10.5pt;color:#444}
p{margin-bottom:14px;text-align:justify}
u{text-decoration:underline}
.firmas{display:flex;justify-content:space-between;margin-top:64px}
.firma{text-align:center;width:44%}
.firma-linea{border-top:1px solid #222;padding-top:8px;font-size:10pt}
.footer{text-align:center;font-size:8.5pt;color:#999;margin-top:28px;border-top:1px solid #ddd;padding-top:10px}
@media print{body{padding:24px 40px}@page{margin:2cm}}
</style></head><body>
<div class="header">
  <h1>Contrato de Locación de Vivienda</h1>
  <span class="fecha-label"><u>Fecha:</u> ${hoyStr}</span>
</div>
<p class="subtitulo">Modelo orientativo para ${ciudad}, ${prov}, Argentina.</p>

<p>En la ciudad de <u>${ciudad}</u>, Provincia de <u>${prov}</u>, República Argentina, a los <u>${dia}</u> días del mes de <u>${mes}</u> del año <u>${anio}</u>, entre <u>${propietario}</u>, DNI N° <u>${propDni}</u>, en adelante denominado/a <u>propietario/a</u>, por una parte; y <u>${inquilino}</u>, DNI N° <u>${inqDni}</u>, en adelante denominado/a <u>inquilino/a</u> por la otra, se celebra el presente <u>Contrato de Locación de Vivienda</u>, sujeto a las siguientes cláusulas y condiciones:</p>

<p>El inmueble objeto de la <u>locación</u> se encuentra ubicado en <u>${r.propiedad_direccion}${r.propiedad_ciudad ? ', ' + r.propiedad_ciudad : ''}</u>.</p>

<p>El inmueble será destinado <u>exclusivamente</u> a <u>${r.propiedad_tipo || 'inmueble'}</u>.</p>

<p>La <u>locación</u> tendrá una duración de <u>${meses}</u> meses, iniciando el <u>${fmtD(r.fecha_inicio)}</u>${r.fecha_fin ? ` y finalizando el <u>${fmtD(r.fecha_fin)}</u>` : ''}.</p>

<p>El inquilino <u>abonará</u> la suma mensual de <u>${r.moneda} $${fmtM(mensual)}</u>.</p>

<p>Se entrega en concepto de <u>depósito</u> la suma de <u>${r.moneda} $${fmtM(mensual)}</u>.</p>

${garantes.length > 0 ? `<p>Actúan como <u>garantes</u> del presente contrato: ${garantes.map(g => `<u>${g.apellido || ''} ${g.nombre || ''}</u>, DNI N° <u>${g.dni_cuit || '—'}</u>${g.telefono ? `, tel. ${g.telefono}` : ''}`).join('; ')}.</p>` : ''}

<p>Serán a cargo del inquilino los <u>servicios y gastos</u> que correspondan al uso del inmueble.</p>

<p>El inquilino se <u>compromete</u> a conservar el inmueble en <u>buen estado</u>.</p>

<p>Las partes podrán <u>rescindir</u> el contrato conforme a la <u>normativa vigente</u>.</p>

<p>Para cualquier controversia las partes se someten a los <u>tribunales competentes</u> de ${ciudad}.</p>

<div class="firmas">
  <div class="firma"><div class="firma-linea">Firma Inquilino/a<br><small>${inquilino}</small></div></div>
  <div class="firma"><div class="firma-linea">Firma Propietario/a<br><small>${propietario}</small></div></div>
</div>
<div class="footer">Contrato N° ${r.id} — Sistema Britos — Documento de uso interno</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`

    const w = window.open('', '_blank', 'width=860,height=720')
    w.document.write(doc)
    w.document.close()
  }

  const set  = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))
  const setF = k => e => setModal(m => ({ ...m, data: { ...m.data, [k]: e.target.value } }))

  function handleFechaInicioChange(e) {
    const val = e.target.value
    if (!val) { setModal(m => ({ ...m, data: { ...m.data, fecha_inicio: '' } })); return }
    const d = new Date(val + 'T12:00:00')
    d.setFullYear(d.getFullYear() + 2)
    const fechaFin = d.toISOString().slice(0, 10)
    setModal(m => ({ ...m, data: { ...m.data, fecha_inicio: val, fecha_fin: fechaFin } }))
  }

  function calcMaxFechaFin() {
    if (!modal.data.fecha_inicio) return undefined
    const d = new Date(modal.data.fecha_inicio + 'T12:00:00')
    d.setFullYear(d.getFullYear() + 2)
    return d.toISOString().slice(0, 10)
  }

  async function handlePropChange(e) {
    const propId = e.target.value
    const prop = propList.find(p => String(p.id) === String(propId))
    setModal(m => ({
      ...m,
      data: {
        ...m.data,
        propiedad_id: propId,
        ...(prop?.precio ? { monto: prop.precio, moneda: prop.moneda || m.data.moneda } : {}),
      }
    }))
    setPropGarantes([])
    if (propId) {
      try {
        const res = await getGarantesProp(propId)
        if (res?.success) setPropGarantes(res.data)
      } catch { /* tabla aún no migrada — ignorar */ }
    }
  }

  return (
    <>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>Contratos</h1><p>Contratos de alquiler</p></div>
        <button className="btn btn-primary" onClick={() => openModal()}><i className="bi bi-file-earmark-plus" /> Generar contrato</button>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Buscar</label>
          <input className="filter-input" style={{ width:220 }} placeholder="# contrato, inquilino, propiedad..." value={filters.search} onChange={set('search')} />
        </div>
        <div className="filter-group"><label>Estado</label>
          <select className="filter-input" value={filters.estado} onChange={set('estado')}>
            <option value="">Todos</option><option>Activo</option><option>Finalizado</option><option>Cancelado</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? <div style={{ textAlign:'center', padding:'3rem' }}><Spinner /></div> : (
            <table>
              <thead><tr><th>#</th><th>Propiedad</th><th>Inquilino</th><th>Monto</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={8}><EmptyState icon="bi-file-earmark-text" message="No hay contratos" /></td></tr>
                  : rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ color:'var(--tx-4)', fontSize:'.75rem' }}>#{r.id}</td>
                      <td style={{ maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.propiedad_direccion}</td>
                      <td>{r.cliente_apellido} {r.cliente_nombre||''}</td>
                      <td style={{ fontWeight:600 }}>{r.moneda} {Number(r.monto).toLocaleString('es-AR')}</td>
                      <td>{r.fecha_inicio ? new Date(r.fecha_inicio).toLocaleDateString('es-AR') : '—'}</td>
                      <td>{r.fecha_fin ? new Date(r.fecha_fin).toLocaleDateString('es-AR') : '—'}</td>
                      <td><span className={`badge ${BADG_E[r.estado]||''}`}>{r.estado}</span></td>
                      <td><div className="table-actions">
                        <button className="btn btn-outline btn-sm btn-icon" title="Ver contrato" onClick={() => handlePrint(r)}><i className="bi bi-printer" /></button>
                        <button className="btn btn-outline btn-sm btn-icon" title="Editar" onClick={() => openModal({ ...r, fecha_inicio: r.fecha_inicio?.slice(0,10), fecha_fin: r.fecha_fin?.slice(0,10) })}><i className="bi bi-pencil" /></button>
                        <button className="btn btn-outline btn-sm btn-icon" title="Historial de pagos" onClick={() => openHistorial(r)}><i className="bi bi-clock-history" /></button>
                        <button className="btn btn-outline btn-sm btn-icon" title="Garantes" onClick={() => openGarantes(r)}><i className="bi bi-people" /></button>
                        {r.estado === 'Activo' && <>
                          <button className="btn btn-warning btn-sm btn-icon" title="Cambiar estado" onClick={() => setEstModal({ open:true, item:r, estado:'Finalizado' })}><i className="bi bi-toggle-off" /></button>
                          <button className="btn btn-success btn-sm btn-icon" title="Renovar" onClick={() => setRenModal({ open:true, item:r, data: { ...EMPTY_R } })}><i className="bi bi-arrow-repeat" /></button>
                        </>}
                      </div></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination total={total} page={page} limit={LIMIT} onPage={setPage} />
      </div>

      {/* Create/Edit modal */}
      <Modal open={modal.open} onClose={() => { setModal(m => ({ ...m, open:false })); setPropGarantes([]) }} title={modal.data.id ? 'Editar contrato' : 'Generar contrato de alquiler'} size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(m => ({ ...m, open:false }))}>Cancelar</button>
          {modal.data.id
            ? <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size={14} /> : 'Guardar'}</button>
            : <button className="btn btn-primary" onClick={handleGenerar} disabled={saving}>{saving ? <Spinner size={14} /> : <><i className="bi bi-floppy" /> Guardar contrato</>}</button>
          }
        </>}
      >
        <div className="form-group"><label className="form-label">Propiedad *</label>
          <select className="form-select" value={modal.data.propiedad_id||''} onChange={handlePropChange}>
            <option value="">Seleccioná una propiedad</option>
            {propList.map(p => <option key={p.id} value={p.id}>{p.direccion} — {p.ciudad}</option>)}
          </select>
        </div>
        {propGarantes.length > 0 && (
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'.6rem .9rem', marginBottom:'.5rem', fontSize:'.82rem' }}>
            <span style={{ fontWeight:600, color:'#15803d' }}><i className="bi bi-people-fill" style={{ marginRight:4 }} />Garantes de esta propiedad:</span>
            <ul style={{ margin:'.25rem 0 0 1rem', padding:0 }}>
              {propGarantes.map(g => (
                <li key={g.id} style={{ color:'#166534' }}>
                  {g.apellido} {g.nombre||''}{g.dni_cuit ? ` — DNI ${g.dni_cuit}` : ''}{g.telefono ? ` — ${g.telefono}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="form-group"><label className="form-label">Inquilino *</label>
          <select className="form-select" value={modal.data.cliente_id||''} onChange={setF('cliente_id')}>
            <option value="">Seleccioná un inquilino</option>
            {cliList.map(c => <option key={c.id} value={c.id}>{c.apellido} {c.nombre||''} {c.dni_cuit ? `— ${c.dni_cuit}` : ''}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Agente</label>
          <select className="form-select" value={modal.data.agente_id||''} onChange={setF('agente_id')}>
            <option value="">Sin agente</option>
            {agList.map(a => <option key={a.id} value={a.id}>{a.apellido} {a.nombre}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Fecha inicio *</label>
            <input className="form-control" type="date" value={modal.data.fecha_inicio||''} onChange={handleFechaInicioChange} />
          </div>
          <div className="form-group"><label className="form-label">Fecha fin <small style={{ color:'var(--tx-4)', fontWeight:400 }}>(máx. 2 años)</small></label>
            <input className="form-control" type="date" value={modal.data.fecha_fin||''} min={modal.data.fecha_inicio||undefined} max={calcMaxFechaFin()} onChange={setF('fecha_fin')} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Monto *</label>
            <input className="form-control" type="number" value={modal.data.monto||''} onChange={setF('monto')} />
          </div>
          <div className="form-group"><label className="form-label">Moneda</label>
            <select className="form-select" value={modal.data.moneda||'ARS'} onChange={setF('moneda')}><option>ARS</option><option>USD</option></select>
          </div>
        </div>
      </Modal>

      {/* Estado modal */}
      <Modal open={estModal.open} onClose={() => setEstModal(m => ({ ...m, open:false }))} title="Cambiar estado"
        footer={<>
          <button className="btn btn-outline" onClick={() => setEstModal(m => ({ ...m, open:false }))}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleCambiarEstado} disabled={saving}>{saving ? <Spinner size={14} /> : 'Confirmar'}</button>
        </>}
      >
        <div className="form-group"><label className="form-label">Nuevo estado</label>
          <select className="form-select" value={estModal.estado} onChange={e => setEstModal(m => ({ ...m, estado: e.target.value }))}>
            <option>Activo</option><option>Finalizado</option><option>Cancelado</option>
          </select>
        </div>
        <div className="alert alert-warning mt-2"><i className="bi bi-exclamation-triangle" /> Al finalizar o cancelar, la propiedad vuelve a estado Disponible.</div>
      </Modal>

      {/* Renovar modal */}
      <Modal open={renModal.open} onClose={() => setRenModal(m => ({ ...m, open:false }))} title="Renovar contrato"
        footer={<>
          <button className="btn btn-outline" onClick={() => setRenModal(m => ({ ...m, open:false }))}>Cancelar</button>
          <button className="btn btn-success" onClick={handleRenovar} disabled={saving}>{saving ? <Spinner size={14} /> : 'Renovar'}</button>
        </>}
      >
        <div className="alert alert-info mb-4"><i className="bi bi-info-circle" /> Se finaliza el contrato actual y se crea uno nuevo con las fechas indicadas.</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Nueva fecha fin</label><input className="form-control" type="date" value={renModal.data.nueva_fecha_fin||''} onChange={e => setRenModal(m => ({ ...m, data: { ...m.data, nueva_fecha_fin: e.target.value } }))} /></div>
          <div className="form-group"><label className="form-label">Nuevo monto</label><input className="form-control" type="number" placeholder="Dejar vacío para mantener" value={renModal.data.nuevo_monto||''} onChange={e => setRenModal(m => ({ ...m, data: { ...m.data, nuevo_monto: e.target.value } }))} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Moneda</label>
            <select className="form-select" value={renModal.data.nueva_moneda||''} onChange={e => setRenModal(m => ({ ...m, data: { ...m.data, nueva_moneda: e.target.value } }))}>
              <option value="">Mantener</option><option value="ARS">ARS</option><option value="USD">USD</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Observaciones</label><input className="form-control" value={renModal.data.observaciones||''} onChange={e => setRenModal(m => ({ ...m, data: { ...m.data, observaciones: e.target.value } }))} /></div>
        </div>
      </Modal>

      {/* Garantes modal */}
      <Modal open={garModal.open} onClose={() => setGarModal(m => ({ ...m, open:false }))} title={`Garantes — Contrato #${garModal.item?.id}`} size="lg">
        <div style={{ marginBottom:'1rem' }}>
          <div className="section-title">Garantes actuales</div>
          {garModal.list.length === 0
            ? <p style={{ color:'var(--tx-4)', fontSize:'.8rem' }}>Sin garantes registrados.</p>
            : <table><thead><tr><th>Nombre</th><th>DNI</th><th>Teléfono</th><th></th></tr></thead>
              <tbody>{garModal.list.map(g => (
                <tr key={g.id}>
                  <td>{g.apellido} {g.nombre||''}</td><td>{g.dni_cuit||'—'}</td><td>{g.telefono||'—'}</td>
                  <td><button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirm({ open:true, garanteId:g.id })}><i className="bi bi-trash" /></button></td>
                </tr>
              ))}</tbody></table>
          }
        </div>
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
        <button className="btn btn-primary" onClick={handleAddGarante}><i className="bi bi-plus-lg" /> Agregar</button>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open:false, garanteId:null })} onConfirm={handleRemoveGarante}
        title="Quitar garante" message="¿Eliminar este garante del contrato?" />

      {/* Modal historial de pagos */}
      <Modal open={histModal.open} onClose={() => setHistModal(m => ({ ...m, open:false }))} title={`Historial — Contrato #${histModal.item?.id}`} size="lg">
        {histModal.loading
          ? <div style={{ textAlign:'center', padding:'2rem' }}><Spinner /></div>
          : histModal.rows.length === 0
            ? <p style={{ color:'var(--tx-4)', fontSize:'.9rem', padding:'1rem 0' }}>No hay movimientos registrados para este contrato.</p>
            : <table>
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Monto</th></tr></thead>
                <tbody>
                  {histModal.rows.map(p => (
                    <tr key={p.id}>
                      <td>{p.fecha_pago ? new Date(p.fecha_pago + 'T12:00:00').toLocaleDateString('es-AR') : '—'}</td>
                      <td><span className={`badge ${p.tipo === 'Ingreso' ? 'badge-activo' : 'badge-inactivo'}`}>{p.tipo}</span></td>
                      <td>{p.concepto}</td>
                      <td style={{ fontWeight:600 }}>{p.moneda} {Number(p.monto).toLocaleString('es-AR', { minimumFractionDigits:2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
        }
      </Modal>
    </>
  )
}
