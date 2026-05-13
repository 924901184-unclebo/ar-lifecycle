import { useState, useRef, useEffect } from 'react'
import { Info, Database, RefreshCw, Calculator, ArrowRightLeft, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { PoolConfig, PoolLevel } from '@/types'

const poolColorMap: Record<PoolLevel, { iconBg: string; iconColor: string }> = {
  total: { iconBg: 'bg-pool-total/10', iconColor: 'text-pool-total' },
  receivable: { iconBg: 'bg-pool-receivable/10', iconColor: 'text-pool-receivable' },
  overdue: { iconBg: 'bg-pool-overdue/10', iconColor: 'text-pool-overdue' },
  litigation: { iconBg: 'bg-pool-litigation/10', iconColor: 'text-pool-litigation' },
  baddebt: { iconBg: 'bg-pool-baddebt/10', iconColor: 'text-pool-baddebt' },
}

interface PoolMetaPopoverProps {
  config: PoolConfig
}

export function PoolMetaPopover({ config }: PoolMetaPopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const colors = poolColorMap[config.key]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200",
          open
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground"
        )}
        title="查看数据说明"
      >
        <Info className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-[420px] rounded-xl border border-border bg-card shadow-lg animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", colors.iconBg)}>
                <Info className={cn("h-3.5 w-3.5", colors.iconColor)} />
              </div>
              <span className="text-sm font-semibold text-foreground">{config.label} · 数据说明</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            {[
              { icon: Database, label: '数据来源', value: config.meta.dataSource },
              { icon: RefreshCw, label: '同步机制', value: config.meta.syncMethod },
              { icon: Calculator, label: '计算规则', value: config.meta.calcRule },
              { icon: ArrowRightLeft, label: '进入条件', value: config.meta.entryCondition },
              { icon: ArrowRightLeft, label: '流出条件', value: config.meta.exitCondition },
              { icon: Clock, label: '更新频率', value: config.meta.updateFrequency },
            ].map((row) => {
              const RowIcon = row.icon
              return (
                <div key={row.label} className="flex gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground mt-0.5">
                    <RowIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-muted-foreground">{row.label}</div>
                    <div className="text-sm text-foreground leading-relaxed">{row.value}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 bg-muted/30 rounded-b-xl">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>最近更新：{config.meta.lastUpdated}</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">L{config.level} 状态池</Badge>
          </div>
        </div>
      )}
    </div>
  )
}
