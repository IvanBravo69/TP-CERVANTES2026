?import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getContratos, createContrato, updateContrato, cambiarEstado, renovarContrato, getGarantes, addGarante, removeGarante } from '../../api/contratos'
import { getPropiedades } from '../../api/propiedades'
import { getClientes }    from '../../api/clientes'
import { getAgentes }     from '../../api/agentes'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'

const EMPTY_C = { tipo:'Alquiler', propiedad_id:'', cliente_id:'', agente_id:'', fecha_inicio:'', fecha_fin:'', monto:'', moneda:'USD', observaciones:'' }
const EMPTY_G = { nombre:'', apellido:'', dni_cuit:'', telefono:'', email:'', direccion:'' }
const EMPTY_R = { nueva_fecha_fin:'', nuevo_monto:'', nueva_moneda:'', observaciones:'' }
const BADG_E  = { Activo:'badge-activo', Finalizado:'badge-vendida', Cancelado:'badge-inactivo' }

export default function ContratosPage() {
  const [rows, setRows]         = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [filters, setFilters]   = useState({ tipo:'', estado:'', })
  const [modal, setModal]       = useState({ open:false, data: EMPTY_C })
  const [saving, setSaving]     = useState(false)
  const [estModal, setEstModal] = useState({ open:false, item:null, estado:'' })
  const [renModal, setRenModal] = useState({ open:false, item:null, data: EMPTY_R })
  const [garModal, setGarModal] = useState({ open:false, item:null, list:[], newG: EMPTY_G })
  const [confirm, setConfirm]   = useState({ open:false, garanteId:null })
  const [propList, setPropList] = useState([])
  const [cliList,  setCliList]  = useState([])
  const [agList,   setAgList]   = useState([])
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
      getPropiedades({ limit:200, activo:1, estado:'Disponible' }),
      getClientes({ limit:200, activo:1 }),
      getAgentes({ limit:200, activo:1 }),
    ])
    if (rp?.success) setPropList(rp.data.rows)
    if (rc?.success) setCliList(rc.data.rows)
    if (ra?.success) setAgList(ra.data.rows)
    setModal({ open:true, data })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const d = { ...modal.data, monto: Number(modal.data.monto), propiedad_id: Number(modal.data.propiedad_id), cliente_id: Number(modal.data.cliente_id), agente_id: modal.data.agente_id ? Number(modal.data.agente_id) : null, fecha_fin: modal.data.fecha_fin || null }
      const res = modal.data.id ? await updateContrato(modal.data.id, d) : await createContrato(d)
      if (!res?.success) { toast.error(res?.message || 'Error'); return }
      toast.success(modal.data.id ? 'Contrato actualizado' : 'Contrato creado')
      setModal(m => ({ ...m, open:false })); load(page)
    } catch(e) { toast.error(e?.message || 'Error') }
    finally    { setSaving(false) }
  }

  function handleGenerar() {
    const d = modal.data
    if (!d.tipo || !d.propiedad_id || !d.cliente_id || !d.fecha_inicio || !d.monto) {
      toast.error('Complet� los campos requeridos'); return
    }
    const prop   = propList.find(p => String(p.id) === String(d.propiedad_id)) || {}
    const cli    = cliList.find(c => String(c.id) === String(d.cliente_id)) || {}
    const agente = agList.find(a => String(a.id) === String(d.agente_id))
    const fmt    = (n) => Number(n).toLocaleString('es-AR', { minimumFractionDigits:2 })
    const fmtD   = (s) => s ? new Date(s + 'T12:00:00').toLocaleDateString('es-AR') : '�'
    const hoy    = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })

    const doc = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Contrato de ${d.tipo}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,serif;font-size:12pt;color:#1a1a1a;padding:40px 60px;line-height:1.7}
h1{text-align:center;font-size:18pt;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px}
.sub{text-align:center;color:#555;font-size:10pt;margin-bottom:32px}
.sec-title{font-weight:bold;font-size:11pt;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #999;margin-bottom:10px;padding-bottom:4px;margin-top:20px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:8px}
.field label{font-weight:bold;font-size:10pt}
.obs{border:1px solid #ccc;border-radius:4px;padding:12px;font-size:11pt;min-height:60px}
.firmas{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:60px}
.firma{text-align:center}
.firma-line{border-top:1px solid #333;padding-top:6px;font-size:10pt;margin-top:48px}
.footer{text-align:center;font-size:9pt;color:#888;margin-top:32px;border-top:1px solid #ddd;padding-top:12px}
@media print{body{padding:20px 40px}}
</style></head><body>
<h1>Contrato de ${d.tipo}</h1>
<p class="sub">Generado el ${hoy} � Sistema Britos</p>

<div class="sec-title">Propiedad</div>
<div class="grid">
  <div class="field"><label>T�tulo:</label><br>${prop.titulo || '�'}</div>
  <div class="field"><label>Ciudad:</label><br>${prop.ciudad || '�'}</div>
  <div class="field" style="grid-column:1/-1"><label>Direcci�n:</label><br>${prop.direccion || '�'}</div>
</div>

<div class="sec-title">Cliente</div>
<div class="grid">
  <div class="field"><label>Nombre:</label><br>${cli.nombre || ''} ${cli.apellido || ''}</div>
  <div class="field"><label>DNI / CUIT:</label><br>${cli.dni_cuit || '�'}</div>
  <div class="field"><label>Email:</label><br>${cli.email || '�'}</div>
  <div class="field"><label>Tel�fono:</label><br>${cli.telefono || '�'}</div>
</div>

${agente ? `<div class="sec-title">Agente</div>
<div class="grid"><div class="field"><label>Nombre:</label><br>${agente.apellido} ${agente.nombre}</div>
<div class="field"><label>Matr�cula:</label><br>${agente.matricula || '�'}</div></div>` : ''}

<div class="sec-title">Condiciones econ�micas</div>
<div class="grid">
  <div class="field"><label>Tipo:</label><br>${d.tipo}</div>
  <div class="field"><label>Monto:</label><br>${d.moneda} ${fmt(d.monto)}</div>
  <div class="field"><label>Fecha inicio:</label><br>${fmtD(d.fecha_inicio)}</div>
  <div class="field"><label>Fecha fin:</label><br>${d.fecha_fin ? fmtD(d.fecha_fin) : 'Sin vencimiento'}</div>
</div>

${d.observaciones ? `<div class="sec-title">Observaciones</div><div class="obs">${d.observaciones}</div>` : ''}

<div class="firmas">
  <div class="firma"><div class="firma-line">Firma del cliente<br><small>${cli.nombre || ''} ${cli.apellido || ''}</small></div></div>
  <div class="firma"><div class="firma-line">Representante inmobiliario<br><small>Sistema Britos</small></div></div>
</div>
<div class="footer">Documento generado por Sistema Britos � Solo para uso interno</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`

    const w = window.open('', '_blank', 'width=900,height=700')
    w.document.write(doc)
    w.document.close()
    setModal(m => ({ ...m, open:false }))
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
      toast.success('Contrato renovado � nuevo contrato #' + res.data.id)
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

  const set  = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))
  const setF = k => e => setModal(m => ({ ...m, data: { ...m.data, [k]: e.target.value } }))

  return (
    <>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>Contratos</h1><p>Alquileres y ventas</p></div>
        <button className="btn btn-primary" onClick={() => openModal()}><i className="bi bi-file-earmark-plus" /> Generar contrato</button>
      </div>

      <div className="filters-bar">
        <div className="filter-group"><label>Tipo</label>
          <select className="filter-input" value={filters.tipo} onChange={set('tipo')}>
            <option value="">Todos</option><option>Venta</option><option>Alquiler</option>
          </select>
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
              <thead><tr><th>#</th><th>Tipo</th><th>Propiedad</th><th>Cliente</th><th>Monto</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={9}><EmptyState icon="bi-file-earmark-text" message="No hay contratos" /></td></tr>
                  : rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ color:'var(--tx-4)', fontSize:'.75rem' }}>#{r.id}</td>
                      <td><span className={`badge badge-${r.tipo?.toLowerCase()}`}>{r.tipo}</span></td>
                      <td style={{ maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.propiedad_titulo}</td>
                      <td>{r.cliente_nombre} {r.cliente_apellido||''}</td>
                      <td style={{ fontWeight:600 }}>{r.moneda} {Number(r.monto).toLocaleString('es-AR')}</td>
                      <td>{r.fecha_inicio ? new Date(r.fecha_inicio).toLocaleDateString('es-AR') : '�'}</td>
                      <td>{r.fecha_fin   ? new Date(r.fecha_fin).toLocaleDateString('es-AR')   : '�'}</td>
                      <td><span className={`badge ${BADG_E[r.estado]||''}`}>{r.estado}</span></td>
                      <td><div className="table-actions">
                        <button className="btn btn-outline btn-sm btn-icon" title="Editar" onClick={() => openModal({ ...r, fecha_inicio: r.fecha_inicio?.slice(0,10), fecha_fin: r.fecha_fin?.slice(0,10) })}><i className="bi bi-pencil" /></button>
                        <button className="btn btn-outline btn-sm btn-icon" title="Garantes" onClick={() => openGarantes(r)}><i className="bi bi-people" /></button>
                        {r.estado === 'Activo' && <>
                          <button className="btn btn-warning btn-sm btn-icon" title="Cambiar estado" onClick={() => setEstModal({ open:true, item:r, estado:'Finalizado' })}><i className="bi bi-toggle-off" /></button>
                          {r.tipo === 'Alquiler' && <button className="btn btn-success btn-sm btn-icon" title="Renovar" onClick={() => setRenModal({ open:true, item:r, data: { ...EMPTY_R } })}><i className="bi bi-arrow-repeat" /></button>}
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
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open:false }))} title={modal.data.id ? 'Editar contrato' : 'Generar contrato'} size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(m => ({ ...m, open:false }))}>Cancelar</button>
          {modal.data.id
            ? <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size={14} /> : 'Guardar'}</button>
            : <button className="btn btn-primary" onClick={handleGenerar}><i className="bi bi-printer" /> Generar contrato</button>
          }
        </>}
      >
        <div className="form-row">
          <div className="form-group"><label className="form-label">Tipo *</label>
            <select className="form-select" value={modal.data.tipo||'Alquiler'} onChange={setF('tipo')}><option>Alquiler</option><option>Venta</option></select>
          </div>
          <div className="form-group"><label className="form-label">Moneda</label>
            <select className="form-select" value={modal.data.moneda||'USD'} onChange={setF('moneda')}><option>USD</option><option>ARS</option></select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Propiedad *</label>
          <select className="form-select" value={modal.data.propiedad_id||''} onChange={setF('propiedad_id')}>
            <option value="">Seleccion� una propiedad</option>
            {propList.map(p => <option key={p.id} value={p.id}>{p.titulo} � {p.ciudad}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Cliente *</label>
          <select className="form-select" value={modal.data.cliente_id||''} onChange={setF('cliente_id')}>
            <option value="">Seleccion� un cliente</option>
            {cliList.map(c => <option key={c.id} value={c.id}>{c.apellido} {c.nombre||''} {c.dni_cuit ? `� ${c.dni_cuit}` : ''}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Agente</label>
          <select className="form-select" value={modal.data.agente_id||''} onChange={setF('agente_id')}>
            <option value="">Sin agente</option>
            {agList.map(a => <option key={a.id} value={a.id}>{a.apellido} {a.nombre}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Fecha inicio *</label><input className="form-control" type="date" value={modal.data.fecha_inicio||''} onChange={setF('fecha_inicio')} /></div>
          <div className="form-group"><label className="form-label">Fecha fin</label><input className="form-control" type="date" value={modal.data.fecha_fin||''} onChange={setF('fecha_fin')} /></div>
        </div>
        <div className="form-group"><label className="form-label">Monto *</label><input className="form-control" type="number" value={modal.data.monto||''} onChange={setF('monto')} /></div>
        <div className="form-group"><label className="form-label">Observaciones</label><textarea className="form-control" rows={2} value={modal.data.observaciones||''} onChange={setF('observaciones')} /></div>
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
          <div className="form-group"><label className="form-label">Nuevo monto</label><input className="form-control" type="number" placeholder="Dejar vac�o para mantener" value={renModal.data.nuevo_monto||''} onChange={e => setRenModal(m => ({ ...m, data: { ...m.data, nuevo_monto: e.target.value } }))} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Moneda</label>
            <select className="form-select" value={renModal.data.nueva_moneda||''} onChange={e => setRenModal(m => ({ ...m, data: { ...m.data, nueva_moneda: e.target.value } }))}>
              <option value="">Mantener</option><option value="USD">USD</option><option value="ARS">ARS</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Observaciones</label><input className="form-control" value={renModal.data.observaciones||''} onChange={e => setRenModal(m => ({ ...m, data: { ...m.data, observaciones: e.target.value } }))} /></div>
        </div>
      </Modal>

      {/* Garantes modal */}
      <Modal open={garModal.open} onClose={() => setGarModal(m => ({ ...m, open:false }))} title={`Garantes � Contrato #${garModal.item?.id}`} size="lg">
        <div style={{ marginBottom:'1rem' }}>
          <div className="section-title">Garantes actuales</div>
          {garModal.list.length === 0
            ? <p style={{ color:'var(--tx-4)', fontSize:'.8rem' }}>Sin garantes registrados.</p>
            : <table><thead><tr><th>Nombre</th><th>DNI</th><th>Tel�fono</th><th></th></tr></thead>
              <tbody>{garModal.list.map(g => (
                <tr key={g.id}>
                  <td>{g.apellido} {g.nombre||''}</td><td>{g.dni_cuit||'�'}</td><td>{g.telefono||'�'}</td>
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
          <div className="form-group"><label className="form-label">Tel�fono</label><input className="form-control" value={garModal.newG.telefono||''} onChange={e => setGarModal(m => ({ ...m, newG: { ...m.newG, telefono: e.target.value } }))} /></div>
        </div>
        <button className="btn btn-primary" onClick={handleAddGarante}><i className="bi bi-plus-lg" /> Agregar</button>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open:false, garanteId:null })} onConfirm={handleRemoveGarante}
        title="Quitar garante" message="�Eliminar este garante del contrato?" />
    </>
  )
}

