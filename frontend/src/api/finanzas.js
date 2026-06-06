import client from './client'
export const getPagos        = (p) => client.get('/finanzas', { params: p })
export const getPagosByContrato = (id) => client.get(`/finanzas/contrato/${id}`)
export const createPago      = (d)  => client.post('/finanzas', d)
export const deletePago      = (id) => client.delete(`/finanzas/${id}`)
