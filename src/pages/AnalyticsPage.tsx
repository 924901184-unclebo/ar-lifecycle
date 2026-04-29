import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/utils'
import { agingDistribution, departmentPerformance, monthlyTrend } from '@/data/mockData'
import { TrendChart } from '@/components/charts/TrendChart'

export function AnalyticsPage() {
  const maxAgingAmount = Math.max(...agingDistribution.map(a => a.amount))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">统计分析</h1>
        <p className="mt-1 text-sm text-muted-foreground">多维度数据分析与决策支持</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
                            ? bucket.bucket.includes('180') ? 'hsl(0, 84%, 60%)' : 'hsl(25, 95%, 53%)'
                            : 'hsl(221, 83%, 53%)',
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
          <div className="grid grid-cols-4 gap-4">
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
          <div className="grid grid-cols-3 gap-4">
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
    </div>
  )
}
