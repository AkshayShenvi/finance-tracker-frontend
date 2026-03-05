import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

interface User {
  id: number
  email: string
  username: string
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setIsLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/v1/auth/me')
      setUser(response.data)
    } catch (error) {
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await api.post('/api/v1/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const { access_token } = response.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
  }

  const register = async (email: string, username: string, password: string) => {
    await api.post('/api/v1/auth/register', { email, username, password })
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
