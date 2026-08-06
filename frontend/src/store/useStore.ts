import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Transaction, Customer, PaymentLink, Settlement, Notification, Merchant } from '@/types'
import { api } from '@/lib/api'

interface AppState {
  user: User | null
  merchant: Merchant | null
  isAuthenticated: boolean
  userRole: 'admin' | 'merchant' | 'customer' | null
  transactions: Transaction[]
  customers: Customer[]
  paymentLinks: PaymentLink[]
  settlements: Settlement[]
  notifications: Notification[]
  darkMode: boolean
  sidebarOpen: boolean
  
  setUser: (user: User | null) => void
  setMerchant: (merchant: Merchant | null) => void
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  setCustomers: (customers: Customer[]) => void
  setPaymentLinks: (links: PaymentLink[]) => void
  addPaymentLink: (link: PaymentLink) => void
  setSettlements: (settlements: Settlement[]) => void
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  toggleDarkMode: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  login: (user: User, role: 'admin' | 'merchant' | 'customer') => void
  logout: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      merchant: null,
      isAuthenticated: false,
      userRole: null,
      transactions: [],
      customers: [],
      paymentLinks: [],
      settlements: [],
      notifications: [],
      darkMode: false,
      sidebarOpen: true,

      setUser: (user) => set({ user }),
      setMerchant: (merchant) => set({ merchant }),
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) => set((state) => ({ transactions: [transaction, ...state.transactions] })),
      setCustomers: (customers) => set({ customers }),
      setPaymentLinks: (paymentLinks) => set({ paymentLinks }),
      addPaymentLink: (link) => set((state) => ({ paymentLinks: [link, ...state.paymentLinks] })),
      setSettlements: (settlements) => set({ settlements }),
      setNotifications: (notifications) => set({ notifications }),
      addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
      })),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      login: async (user, role) => {
        set({ user, isAuthenticated: true, userRole: role });
        if (role === 'merchant') {
          try {
            const merchant = await api.getMerchantProfile();
            set({ merchant: merchant as Merchant });
          } catch (err) {
            // Merchant profile might not exist yet for new users
            console.log('Merchant profile not available yet:', err);
            set({ merchant: null });
          }
        } else {
          set({ merchant: null });
        }
      },
      logout: () => set({ 
        user: null, 
        merchant: null, 
        isAuthenticated: false, 
        userRole: null 
      }),
    }),
    {
      name: 'PayMi-storage',
    }
  )
)
