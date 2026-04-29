import { useState } from 'react'
import {
  X, FileText, Upload, Phone, MapPin, Mail, MessageSquare,
  CheckCircle2, AlertCircle, Clock, ArrowRight, Shield, Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import { evidenceItems, collectionRecords, auditLogs } from '@/data/mockData'
import { showToast } from '@/components/ui/toast'
import type { ReceivableItem, PoolLevel } from '@/types'

const poolBadgeVariant: Record<PoolLevel, 'pool-total' | 'pool-receivable' | 'pool-overdue' | 'pool-litigation' | 'pool-baddebt'> = {
  total: 'pool-total',
  receivable: 'pool-receivable',
  overdue: 'pool-overdue',
  litigation: 'pool-litigation',
  baddebt: 'pool-baddebt',
}

interface DetailPanelProps {
  item: ReceivableItem
  onClose: () => void
}

type Tab = 'info' | 'evidence' | 'collection' | 'timeline'

const methodIcons: Record<string, React.ElementType> = {
  phone: Phone,
  visit: MapPin,
  letter: Mail,
  email: Mail,
  wechat: MessageSquare,
}

const evidenceTypeIcons: Record<string, string> = {
  contract: '📄',
  invoice: '🧾',
  delivery: '📦',
  collection: '📞',
  lawyer_letter: '⚖️',
  court_doc: '🏛️',
  communication: '💬',
  other: '📎',
}

export function DetailPanel({ item, onClose }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const itemEvidence = evidenceItems.filter(e => e.receivableId === item.id)
  const itemCollection = collectionRecords.filter(c => c.receivableId === item.id)
  const itemLogs = auditLogs.filter(l => l.receivableId === item.id)

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'info', label: '基本信息' },
    { key: 'evidence', label: '证据链', count: itemEvidence.length },
    { key: 'collection', label: '催收记录', count: itemCollection.length },
    { key: 'timeline', label: '操作日志', count: itemLogs.length },
  ]

  /* Evidence completeness check */
  const requiredTypes = ['contract', 'invoice', 'delivery', 'collection']
  const existingTypes = new Set(itemEvidence.map(e => e.type as string))
  const missingTypes = requiredTypes.filter(t => !existingTypes.has(t))
  const evidenceComplete = missingTypes.length === 0

  const handleUpload = () => {
    showToast('文件上传功能已触发（演示模式）', 'info')
  }

  const handleTransfer = (target: string) => {
    showToast(`已发起"转入${target}"流程`, 'success')
  }

  const handleGeneratePackage = () => {
    if (!evidenceComplete) {
      showToast('证据不足，无法生成诉讼包', 'error')
      return
    }
    showToast('正在生成诉讼包...', 'success')
  }

  return (
    <div className="w-[400px] shrink-0 animate-slide-in-left">
      <Card className="sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto">
        {/* Header */}
        <CardHeader className="border-b border-border pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={poolBadgeVariant[item.poolLevel]}>{item.status}</Badge>
                {item.priority === 'high' && (
                  <Badge variant="destructive">高优先级</Badge>
                )}
              </div>
              <CardTitle className="text-lg">{item.customerShort}</CardTitle>
              <p className="text-xs font-mono text-muted-foreground">{item.contractNo}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Amount summary */}
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3">
            <div>
              <div className="text-[10px] text-muted-foreground">合同金额</div>
              <div className="text-sm font-semibold tabular-nums">¥{formatNumber(item.totalAmount)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">已回款</div>
              <div className="text-sm font-semibold tabular-nums text-success">¥{formatNumber(item.receivedAmount)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">待收金额</div>
              <div className="text-sm font-semibold tabular-nums text-pool-overdue">¥{formatNumber(item.remainingAmount)}</div>
            </div>
          </div>
        </CardHeader>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 px-3 py-2.5 text-xs font-medium transition-colors relative",
                activeTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 text-[10px] tabular-nums">({tab.count})</span>
              )}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        <CardContent className="p-4">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="space-y-2.5">
                {[
                  { label: '客户全称', value: item.customerName },
                  { label: '合同日期', value: item.contractDate },
                  { label: '到期日', value: item.dueDate },
                  { label: '逾期天数', value: item.agingDays > 0 ? `${item.agingDays}天` : '未逾期' },
                  { label: '账龄区间', value: item.agingBucket },
                  { label: '负责人', value: `${item.salesperson} · ${item.department}` },
                  { label: '已开票', value: formatCurrency(item.invoicedAmount) },
                  { label: '最新动态', value: `${item.lastAction}（${item.lastActionDate}）` },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between text-sm">
                    <span className="text-muted-foreground shrink-0">{row.label}</span>
                    <span className="text-right font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>

              {item.notes && (
                <div className="rounded-md bg-muted/50 p-3">
                  <div className="text-[10px] font-semibold text-muted-foreground mb-1">备注</div>
                  <div className="text-sm text-foreground">{item.notes}</div>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2 pt-2 border-t border-border">
                {item.poolLevel === 'overdue' && (
                  <>
                    <Button className="w-full" size="sm" onClick={() => handleTransfer('诉讼/仲裁池')}>
                      <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                      转入诉讼池
                    </Button>
                    <Button className="w-full" variant="outline" size="sm" onClick={() => showToast('催款函已生成', 'success')}>
                      <Mail className="h-3.5 w-3.5 mr-1.5" />
                      发送催款函
                    </Button>
                  </>
                )}
                {item.poolLevel === 'litigation' && (
                  <Button className="w-full" size="sm" onClick={handleGeneratePackage}>
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    生成诉讼包
                  </Button>
                )}
                {item.poolLevel === 'receivable' && (
                  <Button className="w-full" variant="success" size="sm" onClick={() => showToast('回款确认已提交', 'success')}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    确认回款
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Evidence Tab */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              {/* Completeness check */}
              <div className={cn(
                "rounded-lg border p-3",
                evidenceComplete
                  ? "border-success/30 bg-success/5"
                  : "border-warning/30 bg-warning/5"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {evidenceComplete ? (
                    <Shield className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-warning" />
                  )}
                  <span className="text-sm font-medium">
                    {evidenceComplete ? '证据链完整' : '证据链不完整'}
                  </span>
                </div>
                {!evidenceComplete && (
                  <div className="text-xs text-muted-foreground">
                    缺失：{missingTypes.map(t => {
                      const labels: Record<string, string> = { contract: '合同', invoice: '发票', delivery: '交付记录', collection: '催收记录' }
                      return labels[t]
                    }).join('、')}
                  </div>
                )}
              </div>

              {/* Evidence list */}
              <div className="space-y-2">
                {itemEvidence.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 rounded-md border border-border p-2.5 hover:bg-muted/30 transition-colors">
                    <span className="text-lg">{evidenceTypeIcons[ev.type] || '📎'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{ev.fileName}</div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{ev.typeLabel}</span>
                        <span>·</span>
                        <span>{ev.uploadedBy}</span>
                        <span>·</span>
                        <span>{ev.fileSize}</span>
                      </div>
                    </div>
                    {ev.verified ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-warning shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" className="w-full" onClick={handleUpload}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                上传证据文件
              </Button>

              {item.poolLevel === 'litigation' && (
                <Button size="sm" className="w-full" onClick={handleGeneratePackage}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  一键打包诉讼包
                </Button>
              )}
            </div>
          )}

          {/* Collection Records Tab */}
          {activeTab === 'collection' && (
            <div className="space-y-3">
              {itemCollection.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">暂无催收记录</div>
              ) : (
                itemCollection.map(record => {
                  const Icon = methodIcons[record.method] || Phone
                  return (
                    <div key={record.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{record.methodLabel}</div>
                            <div className="text-[10px] text-muted-foreground">{record.date} · {record.operator}</div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-foreground">{record.result}</p>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground italic">{record.notes}</p>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        下次跟进：{record.nextFollowUp}
                      </div>
                    </div>
                  )
                })
              )}

              <Button variant="outline" size="sm" className="w-full" onClick={() => showToast('新增催收记录', 'info')}>
                新增催收记录
              </Button>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-0">
              {itemLogs.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">暂无操作日志</div>
              ) : (
                itemLogs.map((log, i) => (
                  <div key={log.id} className="relative pl-6 pb-4">
                    {/* Timeline line */}
                    {i < itemLogs.length - 1 && (
                      <div className="absolute left-[9px] top-4 bottom-0 w-px bg-border" />
                    )}
                    {/* Dot */}
                    <div className="absolute left-0 top-1.5 h-[18px] w-[18px] rounded-full border-2 border-primary bg-card" />
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-foreground">{log.action}</div>
                      <div className="text-xs text-muted-foreground">{log.detail}</div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{log.operator}</span>
                        <span>·</span>
                        <span>{log.timestamp}</span>
                        <span>·</span>
                        <span>IP: {log.ip}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
