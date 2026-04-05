import { create } from 'zustand'

interface LayoutStore {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  hideLayout: boolean
  setHideLayout: (v: boolean) => void
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  collapsed: false,
  setCollapsed: (v) => set({ collapsed: v }),
  hideLayout: false,
  setHideLayout: (v) => set({ hideLayout: v }),
}))