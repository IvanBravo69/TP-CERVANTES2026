import client from './client'
export const getAgentes      = (p) => client.get('/agentes', { params: p })
export const getAgente       = (id) => client.get(`/agentes/${id}`)
export const createAgente    = (d)  => client.post('/agentes', d)
export const updateAgente    = (id, d) => client.put(`/agentes/${id}`, d)
export const activarAgente   = (id) => client.patch(`/agentes/${id}/activar`)
export const desactivarAgente = (id) => client.patch(`/agentes/${id}/desactivar`)
