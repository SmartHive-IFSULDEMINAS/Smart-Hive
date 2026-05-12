'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  login as loginApi,
  register as registerApi,
  getMe,
  updateProfile as updateProfileApi,
} from '@/lib/api'

interface User {
  id: number
  username: string
  email: string
  role: string
  is_dono?: boolean
  is_gestor?: boolean
  is_apicultor?: boolean
  can_manage_users?: boolean
  can_manage_apiarios?: boolean
  can_view_reports?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: object) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (data: object) => Promise<{ success: boolean; error?: string }>
  isDono: boolean
  isGestor: boolean
  isApicultor: boolean
  canManageUsers: boolean
  canManageApiarios: boolean
  canViewReports: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    setToken(stored)
    if (stored) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [])

  const loadUser = async () => {
    try {
      const response = await getMe()
      setUser(response.data)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await loginApi(username, password)
      const { access, user: userData } = response.data
      localStorage.setItem('token', access)
      setToken(access)
      setUser(userData)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao fazer login',
      }
    }
  }

  const register = async (data: object) => {
    try {
      const response = await registerApi(data)
      const { access, user: newUser } = response.data
      localStorage.setItem('token', access)
      setToken(access)
      setUser(newUser)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao registrar',
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const updateProfile = async (data: object) => {
    try {
      const response = await updateProfileApi(data)
      setUser(response.data)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao atualizar perfil',
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        isDono: user?.is_dono ?? false,
        isGestor: user?.is_gestor ?? false,
        isApicultor: user?.is_apicultor ?? false,
        canManageUsers: user?.can_manage_users ?? false,
        canManageApiarios: user?.can_manage_apiarios ?? false,
        canViewReports: user?.can_view_reports ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
