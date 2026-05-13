import { useState } from 'react'
import { BarChart3, Download, Filter, Table2, PieChart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatNumber } from '@/lib/utils'
import { receivables, departmentPerformance, monthlyTrend } from '@/data/mockData'
import { TrendChart } from '@/components/charts/TrendChart'
import { showToast } from '@/components/ui/toast'

type ReportTab = 'aging' | 'overdue_summary'

/* Aging analysis with bad debt provision ratios */
interface AgingBucket {
  label: string
  range: string
  rate: number
  items: typeof receivables
}

const agingBuckets: { label: string; range: string; rate: number; minDays: number; maxDays: number }[] = [
  { label: '1年内', range: '0-365天', rate: 0.08, minDays: 0, maxDays: 365 },
  { label: '1-2年', range: '366-730天', rate: 0.15, minDays: 366, maxDays: 730 },
  { label: '2-3年', range: '731-1095天', rate: 0.45, minDays: 731, maxDays: 1095 },
  { label: '3-4年', range: '1096-1460天', rate: 0.60, minDays: 1096, maxDays: 1460 },
  { label: '4-5年', range: '1461-1825天', rate: 0.80, minDays: 1461, maxDays: 1825 },
  { label: '5年以上', range: '>1825天', rate: 1.00, minDays: 1826, maxDays: Infinity },
]

/* Overdue summary report data (模拟NC系统逾期报表样表) */
const overdueSummaryData = [
  {
    customer: '北京中关村软件园管理有限公司',
    contractNo: 'CT-2025-0501',
    amount: 2240000,
    agingDays: 59,
    agingBucket: '1年内',
    debtorStatus: '正常经营，资金紧张',
    litigationStatus: '未诉讼',
    collectionMeasures: '电话催收2次，承诺5月底回款',
    estimatedLoss: 179200,
    lossReason: '账龄1年内计提8%',
    salesperson: '赵强',
    department: '华北区',
  },
  {
    customer: '杭州未来科技集团有限公司',
    contractNo: 'CT-2024-1203',
    amount: 1680000,
    agingDays: 118,
    agingBucket: '1年内',
    debtorStatus: '经营正常，疑似故意拖欠',
    litigationStatus: '考虑启动',
    collectionMeasures: '催款函已发、上门拜访、电话催收',
    estimatedLoss: 134400,
    lossReason: '账龄1年内计提8%',
    salesperson: '孙婷',
    department: '华东区',
  },
  {
    customer: '成都天府新区数字科技有限公司',
    contractNo: 'CT-2024-0915',
    amount: 3000000,
    agingDays: 164,
    agingBucket: '1年内',
    debtorStatus: '拒绝沟通，法务已介入',
    litigationStatus: '法务评估中',
    collectionMeasures: '现场拜访、律师函、法务评估',
    estimatedLoss: 240000,
    lossReason: '账龄1年内计提8%',
    salesperson: '周杰',
    department: '西南区',
  },
  {
    customer: '武汉光谷创新科技股份有限公司',
    contractNo: 'CT-2024-0601',
    amount: 2100000,
    agingDays: 302,
    agingBucket: '1年内',
    debtorStatus: '已起诉，一审进行中',
    litigationStatus: '已立案 (2026)鄂01民初3892号',
    collectionMeasures: '诉讼途径追收',
    estimatedLoss: 168000,
    lossReason: '账龄1年内计提8%',
    salesperson: '陈涛',
    department: '华中区',
  },
  {
    customer: '重庆两江新区智能科技有限公司',
    contractNo: 'CT-2023-1105',
    amount: 980000,
    agingDays: 483,
    agingBucket: '1-2年',
    debtorStatus: '一审胜诉，执行中',
    litigationStatus: '执行阶段',
    collectionMeasures: '强制执行，查封银行账户',
    estimatedLoss: 147000,
    lossReason: '账龄1-2年计提15%',
    salesperson: '刘畅',
    department: '西南区',
  },
  {
    customer: '南京江宁区数据服务有限公司',
    contractNo: 'CT-2023-0320',
    amount: 560000,
    agingDays: 758,
    agingBucket: '2-3年',
    debtorStatus: '公司已注销，执行终本',
    litigationStatus: '已结案(执行终本)',
    collectionMeasures: '无可执行财产',
    estimatedLoss: 560000,
    lossReason: '已核销(100%损失)',
    salesperson: '郑凯',
    department: '华东区',
  },
  {
    customer: '天津滨海新区物联网科技有限公司',
    contractNo: 'CT-2025-0420',
    amount: 1600000,
    agingDays: 44,
    agingBucket: '1年内',
    debtorStatus: '正常经营，信用尚可',
    litigationStatus: '未诉讼',
    collectionMeasures: '电话催收，客户承诺月底支付80万',
    estimatedLoss: 128000,
    lossReason: '账龄1年内计提8%',
    salesperson: '赵强',
    department: '华北区',
  },
]

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportTab>('aging')

  /* Calculate aging distribution from receivables */
  const getAgingData = () => {
    const overdueItems = receivables.filter(r => r.poolLevel !== 'total' && r.remainingAmount > 0)
    return agingBuckets.map(bucket => {
      const items = overdueItems.filter(r => r.agingDays >= bucket.minDays && r.agingDays <= bucket.maxDays)
      const totalAmount = items.reduce((sum, r) => sum + r.remainingAmount, 0)
      const provisionAmount = totalAmount * bucket.rate
      return {
        ...bucket,
        count: items.length,
        totalAmount,
        provisionAmount,
      }
    })
  }

  const agingData = getAgingData()
  const totalProvision = agingData.reduce((sum, d) => sum + d.provisionAmount, 0)
  const totalReceivable = agingData.reduce((sum, d) => sum + d.totalAmount, 0)
  const maxAmount = Math.max(...agingData.map(d => d.totalAmount))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">报表中心</h1>
          <p className="mt-1 text-sm text-muted-foreground">账龄分析、坏账计提与逾期管理汇总</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => showToast('报表导出为Excel...', 'info')}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            导出Excel
          </Button>
          <Button size="sm" variant="outline" onClick={() => showToast('报表导出为PDF...', 'info')}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            导出PDF
          </Button>
        </div>
      </div>

      {/* Report tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveReport('aging')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border",
            activeReport === 'aging'
              ? "bg-primary/5 text-primary border-primary/20"
              : "text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
          )}
        >
          <PieChart className="h-4 w-4" />
          账龄分析表
        </button>
        <button
          onClick={() => setActiveReport('overdue_summary')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border",
            activeReport === 'overdue_summary'
              ? "bg-primary/5 text-primary border-primary/20"
              : "text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
          )}
        >
          <Table2 className="h-4 w-4" />
          逾期应收款管理汇总表
        </button>
      </div>

      {/* Aging Analysis Report */}
      {activeReport === 'aging' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="stat-card">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">应收账款总额</div>
                <div className="text-xl font-bold tabular-nums text-foreground mt-1">¥{formatNumber(totalReceivable)}</div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">坏账计提总额</div>
                <div className="text-xl font-bold tabular-nums text-pool-overdue mt-1">¥{formatNumber(totalProvision)}</div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">综合计提比例</div>
                <div className="text-xl font-bold tabular-nums text-warning mt-1">
                  {totalReceivable > 0 ? ((totalProvision / totalReceivable) * 100).toFixed(1) : 0}%
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">涉及合同数</div>
                <div className="text-xl font-bold tabular-nums text-foreground mt-1">
                  {agingData.reduce((sum, d) => sum + d.count, 0)} 笔
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visual chart */}
          <Card>
            <CardHeader>
              <CardTitle>账龄分布可视化</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agingData.map(bucket => {
                  const pct = maxAmount > 0 ? (bucket.totalAmount / maxAmount) * 100 : 0
                  return (
                    <div key={bucket.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-foreground w-16">{bucket.label}</span>
                          <span className="text-xs text-muted-foreground">({bucket.range})</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">{bucket.count}笔</span>
                          <span className="text-sm font-semibold tabular-nums text-foreground w-24 text-right">
                            ¥{formatNumber(bucket.totalAmount)}
                          </span>
                          <Badge variant={
                            bucket.rate >= 0.6 ? 'destructive' :
                            bucket.rate >= 0.15 ? 'warning' :
                            'default'
                          } className="w-14 justify-center">
                            {(bucket.rate * 100).toFixed(0)}%
                          </Badge>
                          <span className="text-sm tabular-nums text-pool-overdue w-24 text-right">
                            ¥{formatNumber(bucket.provisionAmount)}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: bucket.rate >= 0.6
                              ? 'hsl(350, 72%, 56%)'
                              : bucket.rate >= 0.15
                                ? 'hsl(25, 90%, 54%)'
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

          {/* Aging table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>应收账款账龄分析明细表</CardTitle>
              <div className="text-xs text-muted-foreground">报告期：2026年5月</div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="data-table min-w-[600px]">
                <thead>
                  <tr>
                    <th>账龄区间</th>
                    <th>天数范围</th>
                    <th>合同数量</th>
                    <th>应收金额</th>
                    <th>占比</th>
                    <th>坏账计提比例</th>
                    <th>计提金额</th>
                  </tr>
                </thead>
                <tbody>
                  {agingData.map(bucket => (
                    <tr key={bucket.label}>
                      <td className="font-medium">{bucket.label}</td>
                      <td className="text-muted-foreground">{bucket.range}</td>
                      <td className="tabular-nums">{bucket.count}</td>
                      <td className="font-semibold tabular-nums">¥{formatNumber(bucket.totalAmount)}</td>
                      <td className="tabular-nums text-muted-foreground">
                        {totalReceivable > 0 ? ((bucket.totalAmount / totalReceivable) * 100).toFixed(1) : 0}%
                      </td>
                      <td>
                        <Badge variant={
                          bucket.rate >= 0.6 ? 'destructive' :
                          bucket.rate >= 0.15 ? 'warning' :
                          'default'
                        }>
                          {(bucket.rate * 100).toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="font-semibold tabular-nums text-pool-overdue">¥{formatNumber(bucket.provisionAmount)}</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-muted/30 font-semibold">
                    <td>合计</td>
                    <td>-</td>
                    <td className="tabular-nums">{agingData.reduce((s, d) => s + d.count, 0)}</td>
                    <td className="tabular-nums">¥{formatNumber(totalReceivable)}</td>
                    <td>100%</td>
                    <td>
                      <Badge variant="warning">
                        {totalReceivable > 0 ? ((totalProvision / totalReceivable) * 100).toFixed(1) : 0}%
                      </Badge>
                    </td>
                    <td className="tabular-nums text-pool-overdue">¥{formatNumber(totalProvision)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overdue Summary Report */}
      {activeReport === 'overdue_summary' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>逾期应收账款管理汇总表</CardTitle>
              <div className="text-xs text-muted-foreground">参照NC系统逾期报表样表 · 报告期：2026年5月</div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="data-table text-xs">
                  <thead>
                    <tr>
                      <th className="min-w-[120px]">债务人名称</th>
                      <th>合同号</th>
                      <th>欠款金额</th>
                      <th>逾期天数</th>
                      <th>账龄区间</th>
                      <th className="min-w-[140px]">债务人状况</th>
                      <th className="min-w-[140px]">诉讼/仲裁情况</th>
                      <th className="min-w-[160px]">已采取催收措施</th>
                      <th>预计损失</th>
                      <th className="min-w-[100px]">损失原因</th>
                      <th>负责人</th>
                      <th>部门</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueSummaryData.map((row, i) => (
                      <tr key={i}>
                        <td className="font-medium text-foreground">{row.customer.length > 10 ? row.customer.slice(0, 10) + '...' : row.customer}</td>
                        <td className="font-mono">{row.contractNo}</td>
                        <td className="font-semibold tabular-nums text-pool-overdue">¥{formatNumber(row.amount)}</td>
                        <td>
                          <Badge variant={
                            row.agingDays > 180 ? 'pool-litigation' :
                            row.agingDays > 90 ? 'pool-overdue' :
                            row.agingDays > 30 ? 'warning' : 'default'
                          }>
                            {row.agingDays}天
                          </Badge>
                        </td>
                        <td>{row.agingBucket}</td>
                        <td className="text-muted-foreground">{row.debtorStatus}</td>
                        <td>
                          <Badge variant={
                            row.litigationStatus.includes('已立案') ? 'pool-litigation' :
                            row.litigationStatus.includes('执行') ? 'warning' :
                            row.litigationStatus.includes('结案') ? 'pool-baddebt' :
                            'secondary'
                          } className="text-[10px]">
                            {row.litigationStatus}
                          </Badge>
                        </td>
                        <td className="text-muted-foreground">{row.collectionMeasures}</td>
                        <td className="font-semibold tabular-nums text-destructive">¥{formatNumber(row.estimatedLoss)}</td>
                        <td className="text-muted-foreground">{row.lossReason}</td>
                        <td>{row.salesperson}</td>
                        <td className="text-muted-foreground">{row.department}</td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-muted/30 font-semibold">
                      <td>合计</td>
                      <td>-</td>
                      <td className="tabular-nums text-pool-overdue">
                        ¥{formatNumber(overdueSummaryData.reduce((s, r) => s + r.amount, 0))}
                      </td>
                      <td colSpan={5}>共 {overdueSummaryData.length} 笔逾期应收账款</td>
                      <td className="tabular-nums text-destructive">
                        ¥{formatNumber(overdueSummaryData.reduce((s, r) => s + r.estimatedLoss, 0))}
                      </td>
                      <td colSpan={3}>-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Department performance supplement */}
          <Card>
            <CardHeader>
              <CardTitle>部门逾期应收分析</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="data-table min-w-[600px]">
                <thead>
                  <tr>
                    <th>部门</th>
                    <th>应收总额</th>
                    <th>回款率</th>
                    <th>逾期率</th>
                    <th>平均账龄(天)</th>
                    <th>风险等级</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentPerformance.map(dept => (
                    <tr key={dept.department}>
                      <td className="font-medium">{dept.department}</td>
                      <td className="tabular-nums font-semibold">¥{formatNumber(dept.totalAR)}</td>
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
                      <td className="tabular-nums text-muted-foreground">{dept.avgAgingDays}</td>
                      <td>
                        <Badge variant={
                          dept.overdueRate > 50 ? 'destructive' :
                          dept.overdueRate > 20 ? 'warning' : 'success'
                        }>
                          {dept.overdueRate > 50 ? '高风险' : dept.overdueRate > 20 ? '中风险' : '低风险'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Trend chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>逾期趋势分析</CardTitle>
              <span className="text-xs text-muted-foreground">近6个月</span>
            </CardHeader>
            <CardContent>
              <TrendChart data={monthlyTrend} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
