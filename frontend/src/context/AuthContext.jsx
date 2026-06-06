?import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => JSON.parse(localStorage.getItem('sb_user') || 'null'))
  const [token, setToken] = useState(() => localStorage.getItem('sb_token'))

  const login = useCallback((token, usuario) => {
    localStorage.setItem('sb_token', token)
    localStorage.setItem('sb_user',  JSON.stringify(usuario))
    setToken(token)
    setUser(usuario)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sb_token')
    localStorage.removeItem('sb_user')
    setToken(null)
    setUser(null)
  }, [])

  const has = useCallback((perm) => {
    if (!user) return false
    return (user.permisos || []).includes(perm)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, has }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

