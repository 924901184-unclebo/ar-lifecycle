import { useState } from 'react'
import {
  Scale, FileText, Upload, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, Calendar, DollarSign,
  Gavel, ArrowRight, Download, X, Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatNumber } from '@/lib/utils'
import { receivables, poolConfigs } from '@/data/mockData'
import { showToast } from '@/components/ui/toast'
import { useApp } from '@/hooks/useApp'
import { PoolMetaPopover } from '@/components/ui/PoolMetaPopover'

/* Litigation case data model */
interface LitigationStage {
  id: string
  name: string
  status: 'completed' | 'active' | 'pending'
  date?: string
  documents: { name: string; uploaded: boolean; required: boolean }[]
  subSteps: { label: string; completed: boolean; date?: string; note?: string }[]
}

interface LitigationCase {
  receivableId: string
  caseNo: string
  court: string
  filingDate: string
  amount: number
  interestAmount: number
  lawyer: string
  stages: LitigationStage[]
  currentPhase: '一审' | '二审' | '执行' | '结案'
  hasAppeal: boolean
  result?: '胜诉' | '败诉' | '调解'
}

const mockCases: LitigationCase[] = [
  {
    receivableId: 'AR-2026-007',
    caseNo: '(2026)鄂01民初3892号',
    court: '武汉市中级人民法院',
    filingDate: '2026-03-05',
    amount: 2100000,
    interestAmount: 126000,
    lawyer: '王律师（合作律所）',
    currentPhase: '一审',
    hasAppeal: false,
    stages: [
      {
        id: 'filing',
        name: '申请立案',
        status: 'completed',
        date: '2026-03-01',
        documents: [
          { name: '起诉状', uploaded: true, required: true },
          { name: '证据清单', uploaded: true, required: true },
          { name: '授权委托书', uploaded: true, required: true },
        ],
        subSteps: [
          { label: '准备起诉材料', completed: true, date: '2026-02-25' },
          { label: '证据链完整性校验', completed: true, date: '2026-02-28', note: '合同+发票+交付+催收记录齐全' },
          { label: '向法院递交诉状', completed: true, date: '2026-03-01' },
        ],
      },
      {
        id: 'accepted',
        name: '立案受理',
        status: 'completed',
        date: '2026-03-05',
        documents: [
          { name: '立案通知书', uploaded: true, required: true },
          { name: '诉讼费缴费凭证', uploaded: true, required: true },
          { name: '受理通知书', uploaded: true, required: true },
        ],
        subSteps: [
          { label: '法院立案审查', completed: true, date: '2026-03-03' },
          { label: '录入案号', completed: true, date: '2026-03-05', note: '案号: (2026)鄂01民初3892号' },
          { label: '缴纳诉讼费', completed: true, date: '2026-03-05', note: '诉讼费 ¥24,400' },
        ],
      },
      {
        id: 'hearing',
        name: '开庭审理',
        status: 'active',
        date: '2026-05-20',
        documents: [
          { name: '传票', uploaded: true, required: true },
          { name: '质证意见', uploaded: false, required: true },
          { name: '庭审笔录', uploaded: false, required: false },
        ],
        subSteps: [
          { label: '送达传票', completed: true, date: '2026-04-10', note: '传票已送达被告' },
          { label: '证据交换', completed: true, date: '2026-04-25' },
          { label: '开庭审理', completed: false, date: '2026-05-20', note: '预计开庭日期' },
        ],
      },
      {
        id: 'judgment',
        name: '一审判决',
        status: 'pending',
        documents: [
          { name: '判决书', uploaded: false, required: true },
          { name: '送达回证', uploaded: false, required: true },
        ],
        subSteps: [
          { label: '等待判决', completed: false },
          { label: '录入判决结果', completed: false },
          { label: '判决生效/上诉', completed: false },
        ],
      },
    ],
  },
  {
    receivableId: 'AR-2026-008',
    caseNo: '(2025)渝05民初8821号',
    court: '重庆市第五中级人民法院',
    filingDate: '2025-09-15',
    amount: 980000,
    interestAmount: 58800,
    lawyer: '李律师（内部法务）',
    currentPhase: '执行',
    hasAppeal: false,
    result: '胜诉',
    stages: [
      {
        id: 'filing',
        name: '申请立案',
        status: 'completed',
        date: '2025-09-10',
        documents: [
          { name: '起诉状', uploaded: true, required: true },
          { name: '证据清单', uploaded: true, required: true },
          { name: '授权委托书', uploaded: true, required: true },
        ],
        subSteps: [
          { label: '准备起诉材料', completed: true, date: '2025-09-05' },
          { label: '向法院递交诉状', completed: true, date: '2025-09-10' },
        ],
      },
      {
        id: 'accepted',
        name: '立案受理',
        status: 'completed',
        date: '2025-09-15',
        documents: [
          { name: '立案通知书', uploaded: true, required: true },
          { name: '诉讼费缴费凭证', uploaded: true, required: true },
        ],
        subSteps: [
          { label: '法院立案审查', completed: true, date: '2025-09-12' },
          { label: '录入案号', completed: true, date: '2025-09-15' },
          { label: '缴纳诉讼费', completed: true, date: '2025-09-15', note: '诉讼费 ¥13,600' },
        ],
      },
      {
        id: 'hearing',
        name: '开庭审理',
        status: 'completed',
        date: '2025-12-10',
        documents: [
          { name: '传票', uploaded: true, required: true },
          { name: '庭审笔录', uploaded: true, required: true },
        ],
        subSteps: [
          { label: '送达传票', completed: true, date: '2025-10-20' },
          { label: '证据交换', completed: true, date: '2025-11-15' },
          { label: '开庭审理', completed: true, date: '2025-12-10' },
        ],
      },
      {
        id: 'judgment',
        name: '一审判决',
        status: 'completed',
        date: '2026-03-20',
        documents: [
          { name: '判决书', uploaded: true, required: true },
          { name: '送达回证', uploaded: true, required: true },
        ],
        subSteps: [
          { label: '判决结果', completed: true, date: '2026-03-20', note: '胜诉 — 判令支付¥980,000及利息¥58,800' },
          { label: '判决送达', completed: true, date: '2026-03-25' },
          { label: '判决生效', completed: true, date: '2026-04-10', note: '对方未上诉，判决生效' },
        ],
      },
      {
        id: 'execution',
        name: '强制执行',
        status: 'active',
        date: '2026-04-15',
        documents: [
          { name: '执行申请书', uploaded: true, required: true },
          { name: '执行通知书', uploaded: true, required: true },
        ],
        subSteps: [
          { label: '申请强制执行', completed: true, date: '2026-04-15' },
          { label: '查封银行账户', completed: true, date: '2026-04-20', note: '已查封对方2个银行账户' },
          { label: '执行回款', completed: false, note: '等待划拨' },
        ],
      },
    ],
  },
]

export function LitigationPage() {
  const { currentRole } = useApp()
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(['hearing', 'execution']))
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showJudgmentModal, setShowJudgmentModal] = useState(false)

  const litigationItems = receivables.filter(r => r.poolLevel === 'litigation')
  const activeCase = mockCases[selectedCaseIdx]

  const toggleStage = (stageId: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev)
      next.has(stageId) ? next.delete(stageId) : next.add(stageId)
      return next
    })
  }

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-success" />
      case 'active': return <Clock className="h-5 w-5 text-primary animate-pulse" />
      case 'pending': return <AlertCircle className="h-5 w-5 text-muted-foreground/40" />
      default: return null
    }
  }

  const handleUploadDoc = () => {
    showToast('文书上传成功（演示模式）', 'success')
    setShowUploadModal(false)
  }

  const handleJudgmentResult = (result: string) => {
    if (result === '胜诉') {
      showToast('已录入胜诉判决，请选择后续操作：判决生效 或 对方上诉', 'success')
    } else {
      showToast('已录入败诉判决，是否启动二审或转入坏账核销池？', 'warning')
    }
    setShowJudgmentModal(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="pool-litigation" className="text-xs">Level 4</Badge>
            <h1 className="text-2xl font-bold text-foreground">诉讼/仲裁管理</h1>
            <PoolMetaPopover config={poolConfigs.find(p => p.key === 'litigation')!} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">法律程序全流程跟踪，文书管理与时间轴可视化</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="pool-litigation">{litigationItems.length} 件在审</Badge>
          <span className="text-lg font-bold tabular-nums text-foreground">
            ¥{formatNumber(litigationItems.reduce((s, r) => s + r.remainingAmount, 0))}
          </span>
        </div>
      </div>

      {/* Left-Right Layout: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Left: Case list */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            案件列表
          </div>
          {mockCases.map((c, i) => {
            const item = receivables.find(r => r.id === c.receivableId)
            return (
              <button
                key={c.caseNo}
                onClick={() => setSelectedCaseIdx(i)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-all duration-200",
                  selectedCaseIdx === i
                    ? "border-pool-litigation/30 bg-pool-litigation-muted/50 shadow-sm"
                    : "border-border hover:border-border hover:bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">{item?.customerShort}</span>
                  <Badge variant={
                    c.currentPhase === '执行' ? 'success' :
                    c.currentPhase === '结案' ? 'secondary' :
                    'pool-litigation'
                  } className="text-[10px] px-1.5 py-0">
                    {c.currentPhase}
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">{c.caseNo}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{c.court}</div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-sm font-bold tabular-nums text-pool-litigation">
                    ¥{formatNumber(c.amount + c.interestAmount)}
                  </span>
                  {c.result && (
                    <span className="text-[10px] font-medium text-success">{c.result}</span>
                  )}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  律师：{c.lawyer}
                </div>
              </button>
            )
          })}

          {/* Case summary card */}
          <Card className="mt-4">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs">案件概要</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {[
                { label: '案号', value: activeCase.caseNo },
                { label: '立案日期', value: activeCase.filingDate },
                { label: '诉请金额', value: `¥${formatNumber(activeCase.amount)}` },
                { label: '利息', value: `¥${formatNumber(activeCase.interestAmount)}` },
                { label: '当前阶段', value: activeCase.currentPhase },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium text-foreground text-right max-w-[120px] truncate">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Timeline Detail */}
        <div className="lg:col-span-3 min-w-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-pool-litigation" />
                诉讼阶段时间轴
              </CardTitle>
              <div className="flex items-center gap-2">
                {currentRole === 'legal' || currentRole === 'admin' ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setShowUploadModal(true)}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      上传文书
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => showToast('正在生成诉讼证据包...', 'info')}>
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      导出证据包
                    </Button>
                    {activeCase.stages.find(s => s.id === 'judgment' && s.status === 'active') && (
                      <Button size="sm" onClick={() => setShowJudgmentModal(true)}>
                        <Gavel className="h-3.5 w-3.5 mr-1.5" />
                        录入判决
                      </Button>
                    )}
                    {activeCase.result === '胜诉' && activeCase.currentPhase === '执行' && (
                      <Button size="sm" variant="success" onClick={() => showToast('已标记案件结案', 'success')}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        标记结案
                      </Button>
                    )}
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => showToast('正在生成诉讼证据包...', 'info')}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    导出证据包
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Stage progress bar */}
              <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-muted/30">
                {activeCase.stages.map((stage, idx) => {
                  const completedSteps = stage.subSteps.filter(s => s.completed).length
                  const totalSteps = stage.subSteps.length
                  return (
                    <div key={stage.id} className="flex-1 flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-muted-foreground">{stage.name}</span>
                          <span className="tabular-nums font-medium">{completedSteps}/{totalSteps}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              stage.status === 'completed' ? "bg-success" :
                              stage.status === 'active' ? "bg-primary" :
                              "bg-muted-foreground/20"
                            )}
                            style={{ width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      {idx < activeCase.stages.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Vertical Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

                {activeCase.stages.map((stage, idx) => {
                  const isExpanded = expandedStages.has(stage.id)
                  const isLast = idx === activeCase.stages.length - 1

                  return (
                    <div key={stage.id} className={cn("relative pl-12", !isLast && "pb-4")}>
                      {/* Timeline node */}
                      <div className={cn(
                        "absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card",
                        stage.status === 'completed' ? "border-success" :
                        stage.status === 'active' ? "border-primary" :
                        "border-muted-foreground/20"
                      )}>
                        {getStageIcon(stage.status)}
                      </div>

                      {/* Stage content */}
                      <div className={cn(
                        "rounded-lg border transition-all duration-200",
                        stage.status === 'active' ? "border-primary/30 bg-primary/[0.02] shadow-sm" :
                        stage.status === 'completed' ? "border-border bg-card" :
                        "border-border/50 bg-muted/20 opacity-70"
                      )}>
                        {/* Stage header */}
                        <button
                          onClick={() => toggleStage(stage.id)}
                          className="flex w-full items-center justify-between p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm text-foreground">{stage.name}</span>
                            {stage.date && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {stage.date}
                              </span>
                            )}
                            <Badge variant={
                              stage.status === 'completed' ? 'success' :
                              stage.status === 'active' ? 'default' :
                              'secondary'
                            } className="text-[10px]">
                              {stage.status === 'completed' ? '已完成' :
                               stage.status === 'active' ? '进行中' : '待处理'}
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                            {/* Sub-steps */}
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">进展节点</div>
                              {stage.subSteps.map((step, si) => (
                                <div key={si} className="flex items-start gap-2.5 py-1">
                                  <div className={cn(
                                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                                    step.completed ? "bg-success/10" : "bg-muted"
                                  )}>
                                    {step.completed ? (
                                      <CheckCircle2 className="h-3 w-3 text-success" />
                                    ) : (
                                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "text-xs",
                                        step.completed ? "text-foreground" : "text-muted-foreground"
                                      )}>
                                        {step.label}
                                      </span>
                                      {step.date && (
                                        <span className="text-[10px] text-muted-foreground">{step.date}</span>
                                      )}
                                    </div>
                                    {step.note && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5">{step.note}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Documents */}
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">关联文书</div>
                              <div className="grid grid-cols-2 gap-2">
                                {stage.documents.map((doc, di) => (
                                  <div
                                    key={di}
                                    className={cn(
                                      "flex items-center gap-2 rounded-md border px-2.5 py-1.5",
                                      doc.uploaded
                                        ? "border-success/20 bg-success/5"
                                        : doc.required
                                          ? "border-warning/20 bg-warning/5"
                                          : "border-border bg-muted/30"
                                    )}
                                  >
                                    <FileText className={cn(
                                      "h-3.5 w-3.5 shrink-0",
                                      doc.uploaded ? "text-success" :
                                      doc.required ? "text-warning" : "text-muted-foreground"
                                    )} />
                                    <span className="text-[11px] font-medium truncate flex-1">{doc.name}</span>
                                    {doc.uploaded ? (
                                      <Eye className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-primary" />
                                    ) : (
                                      <Upload className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-primary" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bottom actions for legal */}
              {(currentRole === 'legal' || currentRole === 'admin') && (
                <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => showToast('诉讼费用明细已导出', 'info')}>
                    <DollarSign className="h-3.5 w-3.5 mr-1" />
                    费用明细
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => showToast('已发起坏账核销申请', 'warning')}>
                    <ArrowRight className="h-3.5 w-3.5 mr-1" />
                    转坏账核销
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <Card className="w-[480px] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>上传法律文书</CardTitle>
              <button onClick={() => setShowUploadModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">文书类型</label>
                <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>起诉状</option>
                  <option>判决书</option>
                  <option>传票</option>
                  <option>庭审笔录</option>
                  <option>执行申请书</option>
                  <option>其他文书</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">关联阶段</label>
                <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {activeCase.stages.map(s => (
                    <option key={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-8">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">点击或拖拽上传文件</p>
                  <p className="text-[10px] text-muted-foreground mt-1">支持 PDF、Word、JPG 格式</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadModal(false)}>取消</Button>
                <Button onClick={handleUploadDoc}>确认上传</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Judgment Modal */}
      {showJudgmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <Card className="w-[420px] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>录入判决结果</CardTitle>
              <button onClick={() => setShowJudgmentModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">判决结果</label>
                <div className="grid grid-cols-3 gap-2">
                  {['胜诉', '败诉', '调解'].map(result => (
                    <button
                      key={result}
                      onClick={() => handleJudgmentResult(result)}
                      className={cn(
                        "rounded-lg border-2 p-3 text-center text-sm font-medium transition-all",
                        result === '胜诉'
                          ? "border-success/30 hover:border-success hover:bg-success/5 text-success"
                          : result === '败诉'
                            ? "border-destructive/30 hover:border-destructive hover:bg-destructive/5 text-destructive"
                            : "border-warning/30 hover:border-warning hover:bg-warning/5 text-warning"
                      )}
                    >
                      {result}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">判决金额</label>
                <input
                  type="text"
                  placeholder="请输入判决支持金额"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={formatNumber(activeCase.amount + activeCase.interestAmount)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">备注</label>
                <textarea
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                  rows={3}
                  placeholder="录入判决相关备注..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
