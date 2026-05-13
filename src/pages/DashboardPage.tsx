import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Scale, Archive, Percent, Clock, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatNumber } from '@/lib/utils'
import { dashboardStats, monthlyTrend, receivables, poolConfigs } from '@/data/mockData'
import { useApp } from '@/hooks/useApp'
import { PoolFlowChart } from '@/components/charts/PoolFlowChart'
import { TrendChart } from '@/components/charts/TrendChart'
import type { PoolLevel } from '@/types'

/* 往年逾期数据（与 OverduePage 保持一致） */
const historicalOverdueItems = [
  {
    id: 'MANUAL-001', contractNo: 'HT-2023-0088', customerName: '上海星辰文化传播有限公司',
    customerShort: '星辰文化', remainingAmount: 450000, agingDays: 820, agingBucket: '2-3年',
    salesperson: '王小明', lastAction: '电话催收', isManual: true, year: 2023,
  },
  {
    id: 'MANUAL-002', contractNo: 'HT-2022-0215', customerName: '深圳蓝海网络科技有限公司',
    customerShort: '蓝海网络', remainingAmount: 780000, agingDays: 1150, agingBucket: '3-4年',
    salesperson: '李志强', lastAction: '律师函', isManual: true, year: 2022,
  },
  {
    id: 'MANUAL-003', contractNo: 'HT-2024-0142', customerName: '杭州启航品牌策划有限公司',
    customerShort: '启航品牌', remainingAmount: 200000, agingDays: 480, agingBucket: '1-2年',
    salesperson: '陈静', lastAction: '上门拜访', isManual: true, year: 2024,
  },
]

const historicalTotalAmount = historicalOverdueItems.reduce((s, i) => s + i.remainingAmount, 0)

const poolCardStyles: Record<PoolLevel, { border: string; iconBg: string; textColor: string }> = {
  total: { border: 'border-l-pool-total', iconBg: 'bg-pool-total/10', textColor: 'text-pool-total' },
  receivable: { border: 'border-l-pool-receivable', iconBg: 'bg-pool-receivable/10', textColor: 'text-pool-receivable' },
  overdue: { border: 'border-l-pool-overdue', iconBg: 'bg-pool-overdue/10', textColor: 'text-pool-overdue' },
  litigation: { border: 'border-l-pool-litigation', iconBg: 'bg-pool-litigation/10', textColor: 'text-pool-litigation' },
  baddebt: { border: 'border-l-pool-baddebt', iconBg: 'bg-pool-baddebt/10', textColor: 'text-pool-baddebt' },
}

const poolIcons: Record<PoolLevel, React.ElementType> = {
  total: DollarSign,
  receivable: Clock,
  overdue: AlertTriangle,
  litigation: Scale,
  baddebt: Archive,
}

export function DashboardPage() {
  const { setActivePool } = useApp()
  const stats = dashboardStats

  /* 合并往年数据后的统计 */
  const adjustedTotalDebt = stats.totalDebt + historicalTotalAmount
  const adjustedPoolAmounts: Record<PoolLevel, number> = {
    ...stats.poolAmounts,
    overdue: stats.poolAmounts.overdue + historicalTotalAmount,
  }
  const adjustedPoolCounts = {
    ...stats.poolCounts,
    overdue: stats.poolCounts.overdue + historicalOverdueItems.length,
  }

  const kpiCards = [
    { label: '总应收金额', value: adjustedTotalDebt, trend: '+5.2%', trendUp: true, icon: DollarSign },
    { label: '本月回款', value: stats.monthlyCollection, trend: '+12.8%', trendUp: true, icon: TrendingUp },
    { label: '回款率', value: stats.collectionRate, suffix: '%', trend: '+3.1%', trendUp: true, icon: Percent },
    { label: '平均账龄', value: stats.avgAgingDays, suffix: '天', trend: '-2天', trendUp: false, icon: Clock },
  ]

  /* Recent alerts — 包含系统逾期 + 往年逾期，按天数降序 */
  const systemOverdueItems = receivables.filter(r => r.poolLevel === 'overdue')
  const allOverdueForAlert = [
    ...systemOverdueItems.map(i => ({ ...i, isManual: false as const })),
    ...historicalOverdueItems.map(i => ({ ...i, isManual: true as const })),
  ].sort((a, b) => b.agingDays - a.agingDays).slice(0, 6)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">全景仪表盘</h1>
        <p className="mt-1 text-sm text-muted-foreground">应收账款全生命周期实时概览</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <Card key={i} className="stat-card">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                      {kpi.suffix === '%' ? kpi.value : `¥${formatNumber(kpi.value)}`}
                      {kpi.suffix && <span className="text-base font-normal text-muted-foreground ml-0.5">{kpi.suffix}</span>}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  {kpi.trendUp ? (
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-success" />
                  )}
                  <span className="text-xs font-medium text-success">{kpi.trend}</span>
                  <span className="text-xs text-muted-foreground">较上月</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pool Cards - The 5 Level Funnel */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">5级状态池概览</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {poolConfigs.map((pool) => {
            const style = poolCardStyles[pool.key]
            const Icon = poolIcons[pool.key]
            const count = adjustedPoolCounts[pool.key]
            const amount = adjustedPoolAmounts[pool.key]
            return (
              <Card
                key={pool.key}
                className={cn("stat-card cursor-pointer border-l-4", style.border)}
                onClick={() => setActivePool(pool.key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", style.iconBg)}>
                      <Icon className={cn("h-4 w-4", style.textColor)} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">L{pool.level}</div>
                      <div className="text-sm font-semibold text-foreground">{pool.label}</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className={cn("text-xl font-bold tabular-nums", style.textColor)}>
                        ¥{formatNumber(amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{count} 笔</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Pool Flow Visualization */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>资金分布</CardTitle>
          </CardHeader>
          <CardContent>
            <PoolFlowChart overrideAmounts={adjustedPoolAmounts} />
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>应收趋势</CardTitle>
            <span className="text-xs text-muted-foreground">近6个月</span>
          </CardHeader>
          <CardContent>
            <TrendChart data={monthlyTrend} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-pool-overdue" />
            逾期预警
          </CardTitle>
          <button
            onClick={() => setActivePool('overdue')}
            className="text-xs text-primary hover:underline"
          >
            查看全部
          </button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <table className="data-table min-w-[700px]">
            <thead>
              <tr>
                <th>合同编号</th>
                <th>客户名称</th>
                <th>逾期金额</th>
                <th>逾期天数</th>
                <th>账龄区间</th>
                <th>负责人</th>
                <th>最新动态</th>
              </tr>
            </thead>
            <tbody>
              {allOverdueForAlert.map(item => (
                <tr key={item.id} className={cn("row-overdue", item.isManual && "bg-amber-50/30 dark:bg-amber-950/10")}>
                  <td className="font-mono text-xs">
                    <div className="flex items-center gap-1.5">
                      {item.contractNo}
                      {item.isManual && (
                        <span className="inline-block px-1 py-0 text-[9px] font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">往年</span>
                      )}
                    </div>
                  </td>
                  <td className="font-medium">{item.customerShort}</td>
                  <td className="font-semibold tabular-nums text-pool-overdue">¥{formatNumber(item.remainingAmount)}</td>
                  <td>
                    <Badge variant={item.agingDays > 90 ? 'pool-litigation' : 'pool-overdue'}>
                      {item.agingDays}天
                    </Badge>
                  </td>
                  <td className="text-muted-foreground">{item.agingBucket}</td>
                  <td>{item.salesperson}</td>
                  <td className="text-xs text-muted-foreground max-w-[200px] truncate">{item.lastAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
