import { useState } from 'react'
import { Search, Filter, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { auditLogs } from '@/data/mockData'
import { showToast } from '@/components/ui/toast'
import type { UserRole } from '@/types'

const roleColors: Record<UserRole, string> = {
  salesperson: 'default',
  ops_manager: 'pool-receivable',
  finance: 'pool-total',
  legal: 'pool-litigation',
  admin: 'secondary',
}

const roleLabels: Record<UserRole, string> = {
  salesperson: '业务员',
  ops_manager: '运营主管',
  finance: '财务',
  legal: '法务',
  admin: '管理员',
}

export function AuditPage() {
  const [searchTerm, setSearchTerm] = useState('')

  /* Extended mock logs for the page */
  const allLogs = [
    ...auditLogs,
    { id: 'LOG-006', receivableId: 'AR-2026-002', action: '发票开具', operator: '财务部-刘红', role: 'finance' as UserRole, timestamp: '2026-03-10 10:00:00', detail: '开具增值税专用发票，金额¥1,200,000', ip: '10.0.1.15' },
    { id: 'LOG-007', receivableId: 'AR-2026-010', action: '回款确认', operator: '财务部-刘红', role: 'finance' as UserRole, timestamp: '2026-04-05 14:20:00', detail: '确认第一期回款¥500,000到账，银行流水号: TXN2026040512345', ip: '10.0.1.15' },
    { id: 'LOG-008', receivableId: 'AR-2026-006', action: '风险评估', operator: '法务部-王律', role: 'legal' as UserRole, timestamp: '2026-04-18 09:30:00', detail: '法务评估：建议启动诉讼程序，客户存在转移资产嫌疑', ip: '10.0.1.88' },
    { id: 'LOG-009', receivableId: 'AR-2026-012', action: '催收电话', operator: '赵强', role: 'salesperson' as UserRole, timestamp: '2026-04-25 15:45:00', detail: '客户承诺月底支付80万，已记录跟进', ip: '10.0.1.45' },
    { id: 'LOG-010', receivableId: 'AR-2026-008', action: '判决录入', operator: '法务部-王律', role: 'legal' as UserRole, timestamp: '2026-04-01 16:00:00', detail: '一审判决：胜诉，判令对方支付¥980,000及利息', ip: '10.0.1.88' },
  ]

  const sortedLogs = [...allLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const filteredLogs = searchTerm
    ? sortedLogs.filter(l =>
        l.action.includes(searchTerm) ||
        l.operator.includes(searchTerm) ||
        l.receivableId.includes(searchTerm) ||
        l.detail.includes(searchTerm)
      )
    : sortedLogs

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">操作日志</h1>
        <p className="mt-1 text-sm text-muted-foreground">全量操作审计追踪，所有增删改查均有记录</p>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索操作人、动作、详情..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              按角色筛选
            </Button>
            <Button variant="outline" size="sm" onClick={() => showToast('日志导出已触发', 'info')}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              导出日志
            </Button>
            <div className="ml-auto text-xs text-muted-foreground">
              共 {filteredLogs.length} 条记录 · 保留期限 3年
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="data-table min-w-[700px]">
            <thead>
              <tr>
                <th>时间</th>
                <th>关联单号</th>
                <th>操作</th>
                <th>操作人</th>
                <th>角色</th>
                <th>详情</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td className="text-xs text-muted-foreground whitespace-nowrap">{log.timestamp}</td>
                  <td className="font-mono text-xs">{log.receivableId}</td>
                  <td className="font-medium">{log.action}</td>
                  <td>{log.operator}</td>
                  <td>
                    <Badge variant={roleColors[log.role] as 'default'}>
                      {roleLabels[log.role]}
                    </Badge>
                  </td>
                  <td className="text-xs text-muted-foreground max-w-[300px] truncate">{log.detail}</td>
                  <td className="font-mono text-xs text-muted-foreground">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
