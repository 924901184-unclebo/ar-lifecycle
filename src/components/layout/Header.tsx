import { Bell, Search, User, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp, roleLabels } from '@/hooks/useApp'
import { useState } from 'react'
import type { UserRole } from '@/types'
import { showToast } from '@/components/ui/toast'

export function Header() {
  const { currentRole, setCurrentRole, sidebarCollapsed } = useApp()
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  const roles: UserRole[] = ['salesperson', 'ops_manager', 'finance', 'legal', 'admin']

  return (
    <header className={cn(
      "fixed top-0 right-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-card/90 backdrop-blur-xl px-6 transition-all duration-300",
      sidebarCollapsed ? "left-[64px]" : "left-[240px]"
    )}>
      {/* Search */}
      <div className={cn(
        "relative flex items-center rounded-lg border bg-background px-3 transition-all duration-200",
        searchFocused ? "w-80 border-primary shadow-sm" : "w-64 border-border"
      )}>
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="搜索合同号、客户名称..."
          className="h-8 w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          onClick={() => showToast('3条逾期预警通知：中关村软件(59天)、未来科技(118天)、天府数字(164天)', 'warning')}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
        </button>

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium text-foreground">{roleLabels[currentRole]}</span>
              <span className="text-[10px] text-muted-foreground">演示模式</span>
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", showRoleMenu && "rotate-180")} />
          </button>

          {showRoleMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border border-border/60 bg-card py-1.5 shadow-lg animate-scale-in">
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  切换角色视图
                </div>
                {roles.map(role => (
                  <button
                    key={role}
                    onClick={() => { setCurrentRole(role); setShowRoleMenu(false) }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                      currentRole === role
                        ? "bg-primary/5 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      currentRole === role ? "bg-primary" : "bg-muted-foreground/30"
                    )} />
                    {roleLabels[role]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
