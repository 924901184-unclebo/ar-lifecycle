import { useState, createContext, useContext, type ReactNode } from 'react'
import type { UserRole, PoolLevel } from '@/types'

type PageKey = PoolLevel | 'dashboard' | 'analytics' | 'batch' | 'audit' | 'reports' | 'todos'

interface AppContextType {
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  activePool: PageKey
  setActivePool: (pool: PageKey) => void
  selectedItemId: string | null
  setSelectedItemId: (id: string | null) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('ops_manager')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePool, setActivePool] = useState<PageKey>('dashboard')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  return (
    <AppContext.Provider value={{
      currentRole, setCurrentRole,
      sidebarCollapsed, setSidebarCollapsed,
      activePool, setActivePool,
      selectedItemId, setSelectedItemId,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

const roleLabels: Record<UserRole, string> = {
  salesperson: '业务员',
  ops_manager: '运营主管',
  finance: '财务',
  legal: '法务',
  admin: '超级管理员',
}

export { roleLabels }
export type { PageKey }
