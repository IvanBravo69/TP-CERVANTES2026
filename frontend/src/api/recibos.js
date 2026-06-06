import client from './client'
export const getRecibos   = (p) => client.get('/recibos', { params: p })
export const getRecibo    = (id) => client.get(`/recibos/${id}`)
export const emitirRecibo = (d)  => client.post('/recibos', d)
