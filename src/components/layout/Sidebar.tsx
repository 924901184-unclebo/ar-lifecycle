import {
  LayoutDashboard, Layers, Clock, AlertTriangle, Scale,
  Archive, BarChart3, Send, ClipboardList, ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/hooks/useApp'
import type { PoolLevel } from '@/types'

interface NavItem {
  key: PoolLevel | 'dashboard' | 'analytics' | 'batch' | 'audit'
  label: string
  icon: React.ElementType
  section: string
  poolLevel?: number
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: '全景仪表盘', icon: LayoutDashboard, section: '概览' },
  { key: 'total', label: '总欠款池', icon: Layers, section: '状态池', poolLevel: 1 },
  { key: 'receivable', label: '应收账款池', icon: Clock, section: '状态池', poolLevel: 2 },
  { key: 'overdue', label: '逾期应收池', icon: AlertTriangle, section: '状态池', poolLevel: 3 },
  { key: 'litigation', label: '诉讼/仲裁池', icon: Scale, section: '状态池', poolLevel: 4 },
  { key: 'baddebt', label: '坏账核销池', icon: Archive, section: '状态池', poolLevel: 5 },
  { key: 'analytics', label: '统计分析', icon: BarChart3, section: '决策支持' },
  { key: 'batch', label: '批量作业', icon: Send, section: '决策支持' },
  { key: 'audit', label: '操作日志', icon: ClipboardList, section: '决策支持' },
]

const poolColors: Record<string, string> = {
  total: 'bg-pool-total',
  receivable: 'bg-pool-receivable',
  overdue: 'bg-pool-overdue',
  litigation: 'bg-pool-litigation',
  baddebt: 'bg-pool-baddebt',
}

export function Sidebar() {
  const { activePool, setActivePool, sidebarCollapsed, setSidebarCollapsed, setSelectedItemId } = useApp()

  const sections = [...new Set(navItems.map(i => i.section))]

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300",
      sidebarCollapsed ? "w-[60px]" : "w-[240px]"
    )}>
      {/* Logo area */}
      <div className={cn(
        "flex items-center gap-3 border-b border-sidebar-foreground/10 px-4",
        sidebarCollapsed ? "justify-center h-14" : "h-14"
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--gradient-primary)' }}>
              <span className="text-sm font-bold text-primary-foreground">AR</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">应收管理</span>
              <span className="text-[10px] text-sidebar-foreground/50">业财法一体化</span>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--gradient-primary)' }}>
            <span className="text-sm font-bold text-primary-foreground">AR</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {sections.map(section => (
          <div key={section} className="mb-3">
            {!sidebarCollapsed && (
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section}
              </div>
            )}
            <div className="space-y-0.5">
              {navItems.filter(i => i.section === section).map(item => {
                const isActive = activePool === item.key
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    onClick={() => { setActivePool(item.key); setSelectedItemId(null) }}
                    className={cn(
                      "group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-200",
                      isActive
                        ? "bg-sidebar-active text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground",
                      sidebarCollapsed && "justify-center px-0"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="relative flex items-center">
                      <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary-foreground")} />
                      {item.poolLevel && !sidebarCollapsed && (
                        <span className={cn(
                          "absolute -left-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-primary-foreground",
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
        ))}
      </nav>

      {/* Collapse button */}
      <div className="border-t border-sidebar-foreground/10 p-2">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex w-full items-center justify-center rounded-md py-2 text-sidebar-foreground/50 hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}
