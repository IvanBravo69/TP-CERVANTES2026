import client from './client'
export const getUsuarios      = (p) => client.get('/usuarios', { params: p })
export const getUsuario       = (id) => client.get(`/usuarios/${id}`)
export const createUsuario    = (d)  => client.post('/usuarios', d)
export const updateUsuario    = (id, d) => client.put(`/usuarios/${id}`, d)
export const activarUsuario   = (id) => client.patch(`/usuarios/${id}/activar`)
export const desactivarUsuario = (id) => client.patch(`/usuarios/${id}/desactivar`)
