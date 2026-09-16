import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import api from '../api/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(
        'joineazy_token'
      )

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')

        setUser(response.data.user)
      } catch {
        localStorage.removeItem(
          'joineazy_token'
        )

        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = async (email, password) => {
    const response = await api.post(
      '/auth/login',
      {
        email,
        password,
      }
    )

    const { token, user } = response.data

    localStorage.setItem(
      'joineazy_token',
      token
    )

    setUser(user)

    return user
  }

  const logout = () => {
    localStorage.removeItem(
      'joineazy_token'
    )

    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}