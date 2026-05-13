import { cn } from '@/lib/utils'
import { AppProvider, useApp } from '@/hooks/useApp'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ToastContainer } from '@/components/ui/toast'
import { DashboardPage } from '@/pages/DashboardPage'
import { PoolListPage } from '@/pages/PoolListPage'
import { OverduePage } from '@/pages/OverduePage'
import { LitigationPage } from '@/pages/LitigationPage'
import { WriteOffPage } from '@/pages/WriteOffPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { BatchPage } from '@/pages/BatchPage'
import { AuditPage } from '@/pages/AuditPage'
import { TodoPage } from '@/pages/TodoPage'

function AppContent() {
  const { activePool, sidebarCollapsed } = useApp()

  const renderPage = () => {
    switch (activePool) {
      case 'dashboard':
        return <DashboardPage />
      case 'total':
      case 'receivable':
        return <PoolListPage poolLevel={activePool} />
      case 'overdue':
        return <OverduePage />
      case 'litigation':
        return <LitigationPage />
      case 'baddebt':
        return <WriteOffPage />
      case 'reports':
        return <ReportsPage />
      case 'analytics':
        return <AnalyticsPage />
      case 'batch':
        return <BatchPage />
      case 'audit':
        return <AuditPage />
      case 'todos':
        return <TodoPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />
      <Header />
      <main className={cn(
        "pt-16 transition-all duration-300",
        sidebarCollapsed ? "ml-[64px]" : "ml-[240px]"
      )}>
        <div className="p-4 lg:p-5">
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
