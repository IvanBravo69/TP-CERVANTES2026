import client from './client'
export const getHonorarios   = (p) => client.get('/honorarios', { params: p })
export const getHonorario    = (id) => client.get(`/honorarios/${id}`)
export const createHonorario = (d)  => client.post('/honorarios', d)
export const cobrarHonorario = (id, fecha_cobro) => client.patch(`/honorarios/${id}/cobrar`, { fecha_cobro })
export const getConfig       = ()   => client.get('/honorarios/config')
export const updateConfig    = (configs) => client.put('/honorarios/config', { configs })
