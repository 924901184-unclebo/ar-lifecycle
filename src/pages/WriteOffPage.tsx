import { useState } from 'react'
import {
  CheckCircle2, Clock, X,
  ArrowRight, FileText, DollarSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatNumber } from '@/lib/utils'
import { receivables, poolConfigs } from '@/data/mockData'
import { showToast } from '@/components/ui/toast'
import { useApp } from '@/hooks/useApp'
import { PoolMetaPopover } from '@/components/ui/PoolMetaPopover'

interface ApprovalStep {
  id: string
  roleName: string
  status: 'approved' | 'pending' | 'current' | 'rejected'
  approver?: string
  date?: string
  comment?: string
}

interface WriteOffItem {
  receivableId: string
  reason: string
  accountingEntry: string
  approvalSteps: ApprovalStep[]
  status: '待提交' | '审批中' | '已核销' | '已驳回'
  initiatedDate?: string
}

const writeOffItems: WriteOffItem[] = [
  {
    receivableId: 'AR-2026-009',
    reason: '执行终本，对方公司已注销（统一信用代码：91320115MA1XXXXX），无可执行财产',
    accountingEntry: '借：坏账准备 ¥560,000 / 贷：应收账款——江宁数据 ¥560,000',
    status: '已核销',
    initiatedDate: '2026-02-10',
    approvalSteps: [
      { id: 'step1', roleName: '业务发起', status: 'approved', approver: '郑凯', date: '2026-02-10', comment: '确认无法回收，申请核销' },
      { id: 'step2', roleName: '法务确认', status: 'approved', approver: '王律', date: '2026-02-15', comment: '已确认执行终本裁定书真实性' },
      { id: 'step3', roleName: '财务审核', status: 'approved', approver: '刘红', date: '2026-02-20', comment: '金额核实无误，已生成凭证底稿' },
      { id: 'step4', roleName: '管理层审批', status: 'approved', approver: '张总', date: '2026-02-28', comment: '同意核销' },
    ],
  },
  {
    receivableId: 'AR-2026-008',
    reason: '一审胜诉进入执行阶段，暂不核销（观察期）',
    accountingEntry: '',
    status: '待提交',
    initiatedDate: undefined,
    approvalSteps: [
      { id: 'step1', roleName: '业务发起', status: 'pending' },
      { id: 'step2', roleName: '法务确认', status: 'pending' },
      { id: 'step3', roleName: '财务审核', status: 'pending' },
      { id: 'step4', roleName: '管理层审批', status: 'pending' },
    ],
  },
]

const candidates = [
  { id: 'AR-2026-007', customer: '光谷创新', amount: 2100000, agingDays: 302, reason: '诉讼进行中，如败诉可发起' },
]

export function WriteOffPage() {
  const { currentRole } = useApp()
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [showInitiateModal, setShowInitiateModal] = useState(false)
  const [approvalComment, setApprovalComment] = useState('')

  const baddebtItems = receivables.filter(r => r.poolLevel === 'baddebt')
  const selectedWriteOff = writeOffItems[selectedIdx]
  const relatedItem = receivables.find(r => r.id === selectedWriteOff.receivableId)

  const handleApprove = () => {
    showToast('审批通过，已流转至下一环节', 'success')
    setApprovalComment('')
  }

  const handleReject = () => {
    showToast('审批已驳回', 'warning')
    setApprovalComment('')
  }

  const handleInitiate = () => {
    showToast('坏账核销申请已发起，等待法务确认', 'success')
    setShowInitiateModal(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="pool-baddebt" className="text-xs">Level 5</Badge>
            <h1 className="text-2xl font-bold text-foreground">坏账核销管理</h1>
            <PoolMetaPopover config={poolConfigs.find(p => p.key === 'baddebt')!} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">终局管理：核销审批流、财务凭证生成、NC系统同步</p>
        </div>
        <div className="flex items-center gap-3">
          {(currentRole === 'salesperson' || currentRole === 'admin' || currentRole === 'ops_manager') && (
            <Button size="sm" onClick={() => setShowInitiateModal(true)}>
              <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
              发起核销申请
            </Button>
          )}
          <Badge variant="pool-baddebt">{baddebtItems.length} 笔已核销</Badge>
          <span className="text-lg font-bold tabular-nums text-foreground">
            ¥{formatNumber(baddebtItems.reduce((s, r) => s + r.remainingAmount, 0))}
          </span>
        </div>
      </div>

      {/* Left-Right Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Left: Item list */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            核销记录
          </div>
          {writeOffItems.map((wo, i) => {
            const item = receivables.find(r => r.id === wo.receivableId)
            return (
              <button
                key={wo.receivableId}
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-all duration-200",
                  selectedIdx === i
                    ? "border-pool-baddebt/30 bg-pool-baddebt-muted/50 shadow-sm"
                    : "border-border hover:border-border hover:bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">{item?.customerShort}</span>
                  <Badge variant={
                    wo.status === '已核销' ? 'pool-baddebt' :
                    wo.status === '审批中' ? 'warning' :
                    wo.status === '已驳回' ? 'destructive' :
                    'secondary'
                  } className="text-[10px] px-1.5 py-0">
                    {wo.status}
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">{item?.contractNo}</div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-sm font-bold tabular-nums text-pool-baddebt">
                    ¥{formatNumber(item?.remainingAmount || 0)}
                  </span>
                  {wo.initiatedDate && (
                    <span className="text-[10px] text-muted-foreground">{wo.initiatedDate}</span>
                  )}
                </div>
              </button>
            )
          })}

          {/* Candidates */}
          <div className="mt-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
              待核销候选
            </div>
            {candidates.map(c => (
              <div key={c.id} className="rounded-lg border border-dashed border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{c.customer}</span>
                  <Badge variant="secondary" className="text-[10px]">{c.agingDays}天</Badge>
                </div>
                <div className="text-sm font-bold tabular-nums text-pool-overdue mt-1">
                  ¥{formatNumber(c.amount)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{c.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detail */}
        <div className="lg:col-span-3 min-w-0 space-y-4">
          {/* Approval workflow */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-pool-baddebt" />
                审批流程
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Horizontal approval flow */}
              <div className="flex items-start justify-between relative px-4">
                <div className="absolute top-6 left-12 right-12 h-0.5 bg-border" />
                {selectedWriteOff.approvalSteps.map((step) => (
                  <div key={step.id} className="relative flex flex-col items-center z-10 w-1/4">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border-2 bg-card",
                      step.status === 'approved' ? "border-success" :
                      step.status === 'current' ? "border-primary animate-pulse" :
                      step.status === 'rejected' ? "border-destructive" :
                      "border-muted-foreground/20"
                    )}>
                      {step.status === 'approved' ? (
                        <CheckCircle2 className="h-6 w-6 text-success" />
                      ) : step.status === 'current' ? (
                        <Clock className="h-6 w-6 text-primary" />
                      ) : step.status === 'rejected' ? (
                        <X className="h-6 w-6 text-destructive" />
                      ) : (
                        <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <div className="text-sm font-medium text-foreground">{step.roleName}</div>
                      {step.approver && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">{step.approver}</div>
                      )}
                      {step.date && (
                        <div className="text-[10px] text-muted-foreground">{step.date}</div>
                      )}
                      {step.comment && (
                        <div className="mt-1 max-w-[120px] text-[10px] text-muted-foreground italic leading-tight mx-auto">
                          &ldquo;{step.comment}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Approval action */}
              {selectedWriteOff.status !== '已核销' && selectedWriteOff.status !== '已驳回' && (
                <div className="mt-8 border-t border-border pt-4">
                  <div className="text-sm font-medium text-foreground mb-2">审批意见</div>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    rows={2}
                    placeholder="请输入审批意见..."
                    value={approvalComment}
                    onChange={e => setApprovalComment(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="destructive" size="sm" onClick={handleReject}>
                      <X className="h-3.5 w-3.5 mr-1" />
                      驳回
                    </Button>
                    <Button size="sm" onClick={handleApprove}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      通过
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail info + Accounting entry */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">核销详情</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedItem && (
                  <>
                    {[
                      { label: '客户名称', value: relatedItem.customerName },
                      { label: '合同编号', value: relatedItem.contractNo },
                      { label: '核销金额', value: `¥${formatNumber(relatedItem.remainingAmount)}` },
                      { label: '逾期天数', value: `${relatedItem.agingDays}天` },
                      { label: '负责人', value: relatedItem.salesperson },
                      { label: '状态', value: selectedWriteOff.status },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium text-foreground text-right max-w-[180px] truncate">{row.value}</span>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">核销原因</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed mb-4">{selectedWriteOff.reason}</p>
                {selectedWriteOff.status === '已核销' && selectedWriteOff.accountingEntry && (
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-pool-baddebt" />
                      <span className="text-xs font-semibold text-foreground">财务凭证 (NC同步)</span>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs text-foreground">
                      {selectedWriteOff.accountingEntry}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      <span>已同步至NC系统 · 凭证号: PZ-2026-02-0089</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Initiate Modal */}
      {showInitiateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <Card className="w-[520px] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>发起坏账核销申请</CardTitle>
              <button onClick={() => setShowInitiateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">选择核销对象</label>
                <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {candidates.map(c => (
                    <option key={c.id}>{c.customer} - ¥{formatNumber(c.amount)} (逾期{c.agingDays}天)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">核销原因</label>
                <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>法务判定无法执行</option>
                  <option>账龄超过5年</option>
                  <option>客户已注销/破产</option>
                  <option>执行终本</option>
                  <option>其他原因</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">详细说明</label>
                <textarea
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                  rows={3}
                  placeholder="请详细说明核销理由及依据..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">附件材料</label>
                <div className="mt-1 flex items-center justify-center rounded-lg border-2 border-dashed border-border p-6">
                  <div className="text-center">
                    <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">上传执行终本裁定书、公司注销证明等</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">审批流程预览</div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="default">业务发起</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="pool-litigation">法务确认</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="pool-total">财务审核</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="secondary">管理层审批</Badge>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInitiateModal(false)}>取消</Button>
                <Button onClick={handleInitiate}>提交申请</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
