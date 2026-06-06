import axios from 'axios'

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL })

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sb_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

client.interceptors.response.use(
  r => r.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sb_token')
      localStorage.removeItem('sb_user')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export default client
