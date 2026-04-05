import { create } from 'zustand'

interface User {
  id: number
  phone: string
  username: string
  avatar: string | null
  role: string
  subscription: string
  subExpiresAt: string | null
  targetScore: number | null
  currentScore: number | null
  examDate: string | null
  studyFocus: string | null
  weeklyHours: number | null
    createdAt: string          // ← 加这行
  banned: boolean            // ← 加这行
}

interface AuthStore {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  isAdmin: () => boolean
  isPro: () => boolean
  isBasic: () => boolean
  
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,

  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  isAdmin: () => get().user?.role === 'ADMIN',
  isPro: () => ['PRO', 'ADMIN'].includes(get().user?.subscription || '') || get().user?.role === 'ADMIN',
  isBasic: () => ['BASIC', 'PRO'].includes(get().user?.subscription || '') || get().user?.role === 'ADMIN',
}))