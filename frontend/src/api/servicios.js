import client from './client'
export const getServicios   = (p) => client.get('/servicios', { params: p })
export const getServicio    = (id) => client.get(`/servicios/${id}`)
export const createServicio = (d)  => client.post('/servicios', d)
export const updateServicio = (id, d) => client.put(`/servicios/${id}`, d)
export const pagarServicio  = (id, fecha_pago) => client.patch(`/servicios/${id}/pagar`, { fecha_pago })
