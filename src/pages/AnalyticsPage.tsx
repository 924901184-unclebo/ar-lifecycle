import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatNumber } from '@/lib/utils'
import { agingDistribution, departmentPerformance, monthlyTrend } from '@/data/mockData'
import { TrendChart } from '@/components/charts/TrendChart'
import { Clock, AlertTriangle } from 'lucide-react'

/* 往年逾期数据（与 OverduePage 中的 manualItems 对应 —— 这里为分析展示提供汇总视图） */
const historicalOverdueSummary = {
  totalCount: 3,
  totalAmount: 1430000,
  byYear: [
    { year: 2022, count: 1, amount: 780000 },
    { year: 2023, count: 1, amount: 450000 },
    { year: 2024, count: 1, amount: 200000 },
  ],
  byDepartment: [
    { dept: '华东事业部', count: 2, amount: 650000 },
    { dept: '华南事业部', count: 1, amount: 780000 },
  ],
  avgAgingDays: 817,
  provisionEstimate: 1215000,
}

export function AnalyticsPage() {
  const maxAgingAmount = Math.max(...agingDistribution.map(a => a.amount))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">统计分析</h1>
        <p className="mt-1 text-sm text-muted-foreground">多维度数据分析与决策支持</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Aging Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>账龄分析表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agingDistribution.map(bucket => {
                const pct = maxAgingAmount > 0 ? (bucket.amount / maxAgingAmount) * 100 : 0
                const isOverdue = bucket.bucket !== '未到期'
                return (
                  <div key={bucket.bucket} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{bucket.bucket}</span>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums text-xs text-muted-foreground">{bucket.count}笔</span>
                        <span className="tabular-nums font-medium text-foreground">¥{formatNumber(bucket.amount)}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isOverdue
                            ? bucket.bucket.includes('180') ? 'hsl(350, 72%, 56%)' : 'hsl(25, 90%, 54%)'
                            : 'hsl(145, 63%, 42%)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle>部门回款效能</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="data-table">
              <thead>
                <tr>
                  <th>部门</th>
                  <th>应收总额</th>
                  <th>回款率</th>
                  <th>逾期率</th>
                  <th>平均账龄</th>
                </tr>
              </thead>
              <tbody>
                {departmentPerformance.map(dept => (
                  <tr key={dept.department}>
                    <td className="font-medium">{dept.department}</td>
                    <td className="tabular-nums">¥{formatNumber(dept.totalAR)}</td>
                    <td>
                      <Badge variant={dept.collectionRate >= 70 ? 'success' : dept.collectionRate >= 40 ? 'warning' : 'destructive'}>
                        {dept.collectionRate}%
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={dept.overdueRate <= 20 ? 'success' : dept.overdueRate <= 50 ? 'warning' : 'destructive'}>
                        {dept.overdueRate}%
                      </Badge>
                    </td>
                    <td className="tabular-nums text-muted-foreground">{dept.avgAgingDays}天</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Full width trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>回款趋势分析</CardTitle>
          <span className="text-xs text-muted-foreground">近6个月</span>
        </CardHeader>
        <CardContent>
          <TrendChart data={monthlyTrend} />
        </CardContent>
      </Card>

      {/* Litigation efficiency */}
      <Card>
        <CardHeader>
          <CardTitle>法务效能看板</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '律师函发送量', value: '12', unit: '封/月', color: 'text-primary' },
              { label: '发函后回款率', value: '35.8', unit: '%', color: 'text-success' },
              { label: '诉讼案件数', value: '2', unit: '件在审', color: 'text-pool-litigation' },
              { label: '胜诉率', value: '85', unit: '%', color: 'text-success' },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg bg-muted/50 p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
                <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>
                  {stat.value}
                  <span className="text-sm font-normal text-muted-foreground ml-0.5">{stat.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cash flow prediction */}
      <Card>
        <CardHeader>
          <CardTitle>回款预测（未来3个月）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { month: '2026年5月', predicted: 3800000, confidence: '高', items: 4 },
              { month: '2026年6月', predicted: 4200000, confidence: '中', items: 3 },
              { month: '2026年7月', predicted: 2100000, confidence: '低', items: 2 },
            ].map(pred => (
              <div key={pred.month} className="rounded-lg border border-border p-4">
                <div className="text-sm text-muted-foreground mb-1">{pred.month}</div>
                <div className="text-xl font-bold tabular-nums text-foreground mb-2">
                  ¥{formatNumber(pred.predicted)}
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={pred.confidence === '高' ? 'success' : pred.confidence === '中' ? 'warning' : 'secondary'}>
                    置信度：{pred.confidence}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{pred.items}笔到期</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 往年逾期数据专区 */}
      <Card className="border-amber-200/60 dark:border-amber-800/30">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
              <CardTitle>往年逾期数据分析</CardTitle>
              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                手动录入
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              共 {historicalOverdueSummary.totalCount} 笔 · ¥{formatNumber(historicalOverdueSummary.totalAmount)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 往年按年度分布 */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">按年度分布</div>
              <div className="space-y-2.5">
                {historicalOverdueSummary.byYear.map(item => {
                  const pct = historicalOverdueSummary.totalAmount > 0
                    ? (item.amount / historicalOverdueSummary.totalAmount) * 100
                    : 0
                  return (
                    <div key={item.year} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.year}年</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-muted-foreground">{item.count}笔</span>
                          <span className="tabular-nums font-medium text-foreground">¥{formatNumber(item.amount)}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 往年按部门分布 */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">按部门分布</div>
              <div className="space-y-2.5">
                {historicalOverdueSummary.byDepartment.map(item => {
                  const pct = historicalOverdueSummary.totalAmount > 0
                    ? (item.amount / historicalOverdueSummary.totalAmount) * 100
                    : 0
                  return (
                    <div key={item.dept} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.dept}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-muted-foreground">{item.count}笔</span>
                          <span className="tabular-nums font-medium text-foreground">¥{formatNumber(item.amount)}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 汇总指标 */}
              <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/10 p-3 text-center">
                  <div className="text-[11px] text-muted-foreground mb-0.5">平均逾期天数</div>
                  <div className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {historicalOverdueSummary.avgAgingDays}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">天</span>
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/10 p-3 text-center">
                  <div className="text-[11px] text-muted-foreground mb-0.5">预估坏账准备</div>
                  <div className={cn("text-lg font-bold tabular-nums text-destructive")}>
                    ¥{formatNumber(historicalOverdueSummary.provisionEstimate)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 风险提示 */}
          <div className="mt-5 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200/50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:border-amber-800/30 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">风险提示：</span>
              往年逾期数据中 {historicalOverdueSummary.byYear.filter(y => y.year <= 2023).length} 笔已超过2年账龄，
              建议评估是否转入坏账核销流程。坏账计提比例参考：2-3年 45%，3年以上 60%-100%。
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
