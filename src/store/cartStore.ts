// frontend/src/store/cartStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CartItemType = 'resource' | 'correction'

interface CartItem {
  id: string
  type: CartItemType
  title: string
  price: number
  quantity: number
  // 批改码专属
  codeType?: 'TASK2' | 'TASK1' | 'ANY'
  task2Count?: number
  task1Count?: number
  anyCount?: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set(state => {
          const exists = state.items.find(i => i.id === item.id)
          if (exists) return state
          return { items: [...state.items, { ...item, quantity: 1 }] }
        })
      },
      removeItem: (id) => set(state => ({
        items: state.items.filter(i => i.id !== id),
      })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'ielts-cart' }
  )
)