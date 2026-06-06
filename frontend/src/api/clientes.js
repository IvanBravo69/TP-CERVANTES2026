import client from './client'
export const getClientes      = (p) => client.get('/clientes', { params: p })
export const getCliente       = (id) => client.get(`/clientes/${id}`)
export const createCliente    = (d)  => client.post('/clientes', d)
export const updateCliente    = (id, d) => client.put(`/clientes/${id}`, d)
export const activarCliente   = (id) => client.patch(`/clientes/${id}/activar`)
export const desactivarCliente = (id) => client.patch(`/clientes/${id}/desactivar`)
