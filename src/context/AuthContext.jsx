import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('gt_token'))

  const login = useCallback((jwt) => {
    localStorage.setItem('gt_token', jwt)
    setToken(jwt)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('gt_token')
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
