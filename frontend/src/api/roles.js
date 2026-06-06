import client from './client'
export const getRoles          = () => client.get('/roles')
export const getRol            = (id) => client.get(`/roles/${id}`)
export const createRol         = (d)  => client.post('/roles', d)
export const getPermisos       = () => client.get('/permisos')
export const getPermisosDeRol  = (id) => client.get(`/roles/${id}/permisos`)
export const asignarPermisos   = (id, permiso_ids) => client.put(`/roles/${id}/permisos`, { permiso_ids })
