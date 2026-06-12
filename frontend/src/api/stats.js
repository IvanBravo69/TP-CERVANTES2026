import client from './client'
export const getStats       = (desde, hasta) => client.get('/stats', { params: desde && hasta ? { desde, hasta } : {} })
export const getReportes    = () => client.get('/reportes/resumen')
export const getContratos   = () => client.get('/reportes/contratos-mensuales')
export const getTopClientes = () => client.get('/reportes/top-clientes')
