import client from './client'
export const login  = (data) => client.post('/auth/login', data)
export const profile = ()    => client.get('/auth/profile')
