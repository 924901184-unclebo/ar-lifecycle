import { cn } from '@/lib/utils'
import { AppProvider, useApp } from '@/hooks/useApp'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ToastContainer } from '@/components/ui/toast'
import { DashboardPage } from '@/pages/DashboardPage'
import { PoolListPage } from '@/pages/PoolListPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { BatchPage } from '@/pages/BatchPage'
import { AuditPage } from '@/pages/AuditPage'

function AppContent() {
  const { activePool, sidebarCollapsed } = useApp()

  const renderPage = () => {
    switch (activePool) {
      case 'dashboard':
        return <DashboardPage />
      case 'total':
      case 'receivable':
      case 'overdue':
      case 'litigation':
      case 'baddebt':
        return <PoolListPage poolLevel={activePool} />
      case 'analytics':
        return <AnalyticsPage />
      case 'batch':
        return <BatchPage />
      case 'audit':
        return <AuditPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className={cn(
        "pt-14 transition-all duration-300",
        sidebarCollapsed ? "pl-[60px]" : "pl-[240px]"
      )}>
        <div className="p-6">
          {renderPage()}
        </div>
      </main>
      <ToastContainer />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
