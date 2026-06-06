import client from './client'
export const getStats          = ()       => client.get('/stats')
export const getFinanzasPeriodo = (params) => client.get('/finanzas', { params })
export const getReportes        = ()       => client.get('/reportes/resumen')
export const getContratos       = ()       => client.get('/reportes/contratos-mensuales')
export const getTopClientes     = ()       => client.get('/reportes/top-clientes')
