import { useState } from 'react'
import { Send, Upload, FileText, CheckCircle2, AlertCircle, Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatNumber } from '@/lib/utils'
import { receivables } from '@/data/mockData'
import { showToast } from '@/components/ui/toast'

export function BatchPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchMode, setBatchMode] = useState<'letter' | 'transfer' | null>(null)

  const overdueItems = receivables.filter(r => r.poolLevel === 'overdue')

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === overdueItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(overdueItems.map(r => r.id)))
    }
  }

  const handleBatchSend = () => {
    if (selectedIds.size === 0) {
      showToast('请先选择要发函的记录', 'warning')
      return
    }
    showToast(`已向 ${selectedIds.size} 位客户生成催款函，等待签章...`, 'success')
    setSelectedIds(new Set())
    setBatchMode(null)
  }

  const handleImportExcel = () => {
    showToast('Excel导入功能已触发（演示模式）', 'info')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">批量作业中心</h1>
        <p className="mt-1 text-sm text-muted-foreground">批量催款函发送、案件分配与自动化作业</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className={cn("stat-card cursor-pointer", batchMode === 'letter' && "ring-2 ring-primary")}
          onClick={() => setBatchMode('letter')}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pool-overdue/10">
                <Send className="h-6 w-6 text-pool-overdue" />
              </div>
              <div>
                <div className="text-base font-semibold text-foreground">批量发送催款函</div>
                <div className="text-xs text-muted-foreground mt-0.5">自动生成千人千面催款函</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card cursor-pointer" onClick={handleImportExcel}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-base font-semibold text-foreground">Excel导入客户</div>
                <div className="text-xs text-muted-foreground mt-0.5">批量导入催款客户清单</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card cursor-pointer" onClick={() => showToast('批量打印功能已触发', 'info')}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <Printer className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-base font-semibold text-foreground">批量打印面单</div>
                <div className="text-xs text-muted-foreground mt-0.5">生成电子面单并打印</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch letter sending */}
      {batchMode === 'letter' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>选择催款对象</CardTitle>
                <CardDescription>从逾期应收池中选择需要发送催款函的客户</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    已选 {selectedIds.size} 项 · 合计 ¥{formatNumber(
                      overdueItems.filter(r => selectedIds.has(r.id)).reduce((s, r) => s + r.remainingAmount, 0)
                    )}
                  </span>
                )}
                <Button size="sm" onClick={handleBatchSend} disabled={selectedIds.size === 0}>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  生成催款函 ({selectedIds.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === overdueItems.length && overdueItems.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th>合同编号</th>
                  <th>客户名称</th>
                  <th>逾期金额</th>
                  <th>逾期天数</th>
                  <th>催款函状态</th>
                  <th>物流状态</th>
                </tr>
              </thead>
              <tbody>
                {overdueItems.map(item => (
                  <tr key={item.id} className={cn(selectedIds.has(item.id) && "bg-primary/5")}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="font-mono text-xs">{item.contractNo}</td>
                    <td className="font-medium">{item.customerShort}</td>
                    <td className="font-semibold tabular-nums text-pool-overdue">¥{formatNumber(item.remainingAmount)}</td>
                    <td>
                      <Badge variant="pool-overdue">{item.agingDays}天</Badge>
                    </td>
                    <td>
                      {item.hasLawyerLetter ? (
                        <div className="flex items-center gap-1 text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-xs">已发送</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-xs">未发送</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {item.hasLawyerLetter ? (
                        <Badge variant="success">已签收</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Recent batch history */}
      <Card>
        <CardHeader>
          <CardTitle>近期批量操作记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: '2026-04-10', action: '批量催款函发送', count: 3, operator: '运营部-陈晓', status: '已完成', details: '2封已签收，1封运输中' },
              { date: '2026-03-25', action: '批量催款函发送', count: 5, operator: '运营部-陈晓', status: '已完成', details: '4封已签收，1封被拒收' },
              { date: '2026-03-10', action: '批量案件分配', count: 8, operator: '运营主管-张总', status: '已完成', details: '分配给华北区、华东区业务员' },
            ].map((record, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{record.action}</span>
                    <Badge variant="secondary">{record.count}项</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {record.date} · {record.operator} · {record.details}
                  </div>
                </div>
                <Badge variant="success">{record.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
