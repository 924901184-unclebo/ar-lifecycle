import { dashboardStats } from '@/data/mockData'
import { formatNumber } from '@/lib/utils'
import type { PoolLevel } from '@/types'

const poolData: { key: PoolLevel; label: string; color: string }[] = [
  { key: 'total', label: '总欠款池', color: 'hsl(221, 83%, 53%)' },
  { key: 'receivable', label: '应收账款池', color: 'hsl(199, 89%, 48%)' },
  { key: 'overdue', label: '逾期应收池', color: 'hsl(25, 95%, 53%)' },
  { key: 'litigation', label: '诉讼/仲裁池', color: 'hsl(0, 84%, 60%)' },
  { key: 'baddebt', label: '坏账核销池', color: 'hsl(220, 9%, 46%)' },
]

export function PoolFlowChart() {
  const stats = dashboardStats
  const total = Object.values(stats.poolAmounts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-3">
      {/* Donut-like bar visualization */}
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {poolData.map(pool => {
          const pct = (stats.poolAmounts[pool.key] / total) * 100
          return (
            <div
              key={pool.key}
              className="transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct}%`, backgroundColor: pool.color }}
              title={`${pool.label}: ¥${formatNumber(stats.poolAmounts[pool.key])} (${pct.toFixed(1)}%)`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {poolData.map(pool => {
          const amount = stats.poolAmounts[pool.key]
          const pct = ((amount / total) * 100).toFixed(1)
          return (
            <div key={pool.key} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pool.color }} />
                <span className="text-muted-foreground">{pool.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums font-medium text-foreground">¥{formatNumber(amount)}</span>
                <span className="tabular-nums text-xs text-muted-foreground w-10 text-right">{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between border-t border-border pt-2 mt-2">
        <span className="text-sm font-semibold text-foreground">合计</span>
        <span className="text-sm font-bold tabular-nums text-foreground">¥{formatNumber(total)}</span>
      </div>
    </div>
  )
}
