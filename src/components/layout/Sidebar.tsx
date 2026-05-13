import {
  LayoutDashboard, Layers, Clock, AlertTriangle, Scale,
  Archive, BarChart3, Send, ClipboardList, ChevronLeft,
  ChevronRight, FileBarChart, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/hooks/useApp'
import type { PageKey } from '@/hooks/useApp'
import type { PoolLevel } from '@/types'

interface NavItem {
  key: PageKey
  label: string
  icon: React.ElementType
  section: string
  poolLevel?: number
  roles?: string[] // if specified, only these roles can see this item
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: '全景仪表盘', icon: LayoutDashboard, section: '概览' },
  { key: 'todos', label: '待办事项', icon: Bell, section: '概览' },
  { key: 'total', label: '总欠款池', icon: Layers, section: '状态池', poolLevel: 1 },
  { key: 'receivable', label: '应收账款池', icon: Clock, section: '状态池', poolLevel: 2 },
  { key: 'overdue', label: '逾期应收池', icon: AlertTriangle, section: '状态池', poolLevel: 3 },
  { key: 'litigation', label: '诉讼/仲裁池', icon: Scale, section: '状态池', poolLevel: 4, roles: ['legal', 'admin', 'ops_manager'] },
  { key: 'baddebt', label: '坏账核销池', icon: Archive, section: '状态池', poolLevel: 5 },
  { key: 'reports', label: '报表中心', icon: FileBarChart, section: '决策支持' },
  { key: 'analytics', label: '统计分析', icon: BarChart3, section: '决策支持' },
  { key: 'batch', label: '批量作业', icon: Send, section: '决策支持', roles: ['ops_manager', 'admin'] },
  { key: 'audit', label: '操作日志', icon: ClipboardList, section: '决策支持', roles: ['admin', 'ops_manager', 'finance'] },
]

const poolColors: Record<string, string> = {
  total: 'bg-pool-total',
  receivable: 'bg-pool-receivable',
  overdue: 'bg-pool-overdue',
  litigation: 'bg-pool-litigation',
  baddebt: 'bg-pool-baddebt',
}

export function Sidebar() {
  const { activePool, setActivePool, sidebarCollapsed, setSidebarCollapsed, currentRole, setSelectedItemId } = useApp()

  const sections = [...new Set(navItems.map(i => i.section))]

  /* Filter nav items by role */
  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(currentRole)
  })

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-white/[0.06] transition-all duration-300",
      sidebarCollapsed ? "w-[64px]" : "w-[240px]"
    )} style={{ background: 'var(--gradient-sidebar)' }}>
      {/* Logo area */}
      <div className={cn(
        "flex items-center gap-3 border-b border-white/[0.06] px-4",
        sidebarCollapsed ? "justify-center h-16" : "h-16"
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--gradient-primary)' }}>
              <span className="text-sm font-bold text-white">AR</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-white">应收管理</span>
              <span className="text-[10px] text-white/40">业财法一体化</span>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--gradient-primary)' }}>
            <span className="text-sm font-bold text-white">AR</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {sections.map(section => {
          const sectionItems = visibleItems.filter(i => i.section === section)
          if (sectionItems.length === 0) return null
          return (
            <div key={section} className="mb-4">
              {!sidebarCollapsed && (
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  {section}
                </div>
              )}
              <div className="space-y-1">
                {sectionItems.map(item => {
                  const isActive = activePool === item.key
                  const Icon = item.icon
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setActivePool(item.key); setSelectedItemId(null) }}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-white/60 hover:bg-white/[0.06] hover:text-white/90",
                        sidebarCollapsed && "justify-center px-0"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <div className="relative flex items-center">
                        <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-white" : "text-white/50 group-hover:text-white/80")} />
                        {item.poolLevel && !sidebarCollapsed && (
                          <span className={cn(
                            "absolute -left-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white",
                            poolColors[item.key] || "bg-muted-foreground"
                          )}>
                            {item.poolLevel}
                          </span>
                        )}
                      </div>
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Collapse button */}
      <div className="border-t border-white/[0.06] p-3">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex w-full items-center justify-center rounded-lg py-2.5 text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}
