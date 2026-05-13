import { useState } from 'react'
import {
  CheckCircle2, Clock, AlertTriangle, Scale, Archive,
  FileText, ArrowRight, Bell, Filter, Eye,
  Calculator, Users, Shield, Send,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatNumber } from '@/lib/utils'
import { useApp } from '@/hooks/useApp'
import { showToast } from '@/components/ui/toast'
import type { UserRole } from '@/types'

/* 待办事项类型 */
type TodoPriority = 'urgent' | 'high' | 'normal'
type TodoCategory = 'overdue_followup' | 'reason_fill' | 'writeoff_approve' | 'payment_confirm' | 'litigation_approve' | 'evidence_review' | 'writeoff_final' | 'litigation_initiate'

interface TodoItem {
  id: string
  category: TodoCategory
  title: string
  description: string
  relatedContract: string
  customer: string
  amount: number
  priority: TodoPriority
  dueDate: string
  createdAt: string
  roles: UserRole[] // 哪些角色可见
  status: 'pending' | 'processing' | 'done'
}

const categoryConfig: Record<TodoCategory, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  overdue_followup: { label: '逾期催收', icon: AlertTriangle, color: 'text-pool-overdue', bgColor: 'bg-pool-overdue/10' },
  reason_fill: { label: '原因填报', icon: FileText, color: 'text-warning', bgColor: 'bg-warning/10' },
  writeoff_approve: { label: '核销审批', icon: Archive, color: 'text-pool-baddebt', bgColor: 'bg-pool-baddebt/10' },
  payment_confirm: { label: '回款确认', icon: Calculator, color: 'text-success', bgColor: 'bg-success/10' },
  litigation_approve: { label: '诉讼审批', icon: Scale, color: 'text-pool-litigation', bgColor: 'bg-pool-litigation/10' },
  evidence_review: { label: '证据审核', icon: Shield, color: 'text-primary', bgColor: 'bg-primary/10' },
  writeoff_final: { label: '核销终审', icon: Archive, color: 'text-pool-baddebt', bgColor: 'bg-pool-baddebt/10' },
  litigation_initiate: { label: '诉讼发起', icon: Scale, color: 'text-pool-litigation', bgColor: 'bg-pool-litigation/10' },
}

const priorityConfig: Record<TodoPriority, { label: string; variant: 'destructive' | 'warning' | 'secondary' }> = {
  urgent: { label: '紧急', variant: 'destructive' },
  high: { label: '高', variant: 'warning' },
  normal: { label: '普通', variant: 'secondary' },
}

/* Mock 待办数据 */
const mockTodos: TodoItem[] = [
  // 运营/业务相关
  {
    id: 'TODO-001', category: 'overdue_followup', title: '华媒集团第2期逾期74天待催收',
    description: '该客户已逾期超过60天，需要安排上门拜访或发送律师函', relatedContract: 'AR-2026-004',
    customer: '华媒集团', amount: 1120000, priority: 'urgent', dueDate: '2026-05-15',
    createdAt: '2026-05-10', roles: ['ops_manager', 'salesperson', 'admin'], status: 'pending',
  },
  {
    id: 'TODO-002', category: 'overdue_followup', title: '光耀传媒两期款项逾期超200天',
    description: '两期合计168万逾期，建议评估是否启动诉讼程序', relatedContract: 'AR-2026-005',
    customer: '光耀传媒', amount: 1680000, priority: 'urgent', dueDate: '2026-05-13',
    createdAt: '2026-05-08', roles: ['ops_manager', 'salesperson', 'admin'], status: 'pending',
  },
  {
    id: 'TODO-003', category: 'reason_fill', title: '鼎盛广告第3期逾期原因待记录',
    description: '第3期逾期59天尚未填写逾期原因，请及时补录', relatedContract: 'AR-2026-012',
    customer: '鼎盛广告', amount: 933334, priority: 'high', dueDate: '2026-05-16',
    createdAt: '2026-05-12', roles: ['ops_manager', 'salesperson', 'admin'], status: 'pending',
  },
  {
    id: 'TODO-004', category: 'reason_fill', title: '天宇传媒第4期逾期原因需更新',
    description: '之前填报"故意拖欠"，法务反馈需补充更详细的沟通记录', relatedContract: 'AR-2026-006',
    customer: '天宇传媒', amount: 1125000, priority: 'normal', dueDate: '2026-05-20',
    createdAt: '2026-05-11', roles: ['ops_manager', 'salesperson', 'admin'], status: 'pending',
  },
  // 财务相关
  {
    id: 'TODO-005', category: 'payment_confirm', title: '瑞驰科技回款120万待核销确认',
    description: '银行到账120万元，需核对合同及发票后确认入账', relatedContract: 'AR-2026-002',
    customer: '瑞驰科技', amount: 1200000, priority: 'high', dueDate: '2026-05-14',
    createdAt: '2026-05-12', roles: ['finance', 'admin'], status: 'pending',
  },
  {
    id: 'TODO-006', category: 'writeoff_approve', title: '恒通集团坏账核销申请待审批',
    description: '该客户已进入破产清算程序，业务部门申请全额核销', relatedContract: 'AR-2026-010',
    customer: '恒通集团', amount: 2800000, priority: 'urgent', dueDate: '2026-05-13',
    createdAt: '2026-05-09', roles: ['finance', 'admin'], status: 'pending',
  },
  {
    id: 'TODO-007', category: 'payment_confirm', title: '星辰传媒部分回款26.7万待核对',
    description: '客户付款26.7万，需确认对应第2期应收并更新台账', relatedContract: 'AR-2026-012',
    customer: '星辰传媒（鼎盛广告）', amount: 266667, priority: 'normal', dueDate: '2026-05-16',
    createdAt: '2026-05-13', roles: ['finance', 'admin'], status: 'pending',
  },
  // 法务相关
  {
    id: 'TODO-008', category: 'evidence_review', title: '天宇传媒证据链完整性审核',
    description: '运营已上传催收记录和合同文件，需法务审核证据链完整性', relatedContract: 'AR-2026-006',
    customer: '天宇传媒', amount: 4500000, priority: 'high', dueDate: '2026-05-15',
    createdAt: '2026-05-10', roles: ['legal', 'admin'], status: 'pending',
  },
  {
    id: 'TODO-009', category: 'litigation_approve', title: '光耀传媒诉讼申请待法务确认',
    description: '业务部门已发起诉讼申请，需法务评估胜诉可能性及费用', relatedContract: 'AR-2026-005',
    customer: '光耀传媒', amount: 1680000, priority: 'urgent', dueDate: '2026-05-14',
    createdAt: '2026-05-11', roles: ['legal', 'admin'], status: 'pending',
  },
  // 管理层相关
  {
    id: 'TODO-010', category: 'writeoff_final', title: '恒通集团坏账核销终审',
    description: '财务已审批通过，需管理层做最终核销确认（金额超200万需总经理审批）', relatedContract: 'AR-2026-010',
    customer: '恒通集团', amount: 2800000, priority: 'urgent', dueDate: '2026-05-14',
    createdAt: '2026-05-12', roles: ['admin'], status: 'pending',
  },
  {
    id: 'TODO-011', category: 'litigation_initiate', title: '天宇传媒诉讼发起审批',
    description: '法务评估通过，诉讼费预估8万元，需管理层审批后正式立案', relatedContract: 'AR-2026-006',
    customer: '天宇传媒', amount: 4500000, priority: 'high', dueDate: '2026-05-16',
    createdAt: '2026-05-13', roles: ['admin'], status: 'pending',
  },
]

export function TodoPage() {
  const { currentRole, setActivePool } = useApp()
  const [todos, setTodos] = useState(mockTodos)
  const [filterCategory, setFilterCategory] = useState<TodoCategory | 'all'>('all')

  /* 按角色过滤待办事项 */
  const visibleTodos = todos.filter(t => t.roles.includes(currentRole) && t.status !== 'done')
  const filteredTodos = filterCategory === 'all'
    ? visibleTodos
    : visibleTodos.filter(t => t.category === filterCategory)

  /* 按优先级排序 */
  const priorityOrder: Record<TodoPriority, number> = { urgent: 0, high: 1, normal: 2 }
  const sortedTodos = [...filteredTodos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  /* 统计 */
  const urgentCount = visibleTodos.filter(t => t.priority === 'urgent').length
  const highCount = visibleTodos.filter(t => t.priority === 'high').length
  const totalAmount = visibleTodos.reduce((s, t) => s + t.amount, 0)

  /* 获取当前角色可见的分类列表 */
  const visibleCategories = [...new Set(visibleTodos.map(t => t.category))]

  /* 处理待办 */
  const handleProcess = (todoId: string) => {
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, status: 'processing' as const } : t))
    showToast('已标记为处理中', 'success')
  }

  const handleComplete = (todoId: string) => {
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, status: 'done' as const } : t))
    showToast('待办已完成', 'success')
  }

  /* 跳转到对应页面 */
  const handleNavigate = (todo: TodoItem) => {
    if (todo.category === 'overdue_followup' || todo.category === 'reason_fill') {
      setActivePool('overdue')
    } else if (todo.category === 'writeoff_approve' || todo.category === 'writeoff_final') {
      setActivePool('baddebt')
    } else if (todo.category === 'litigation_approve' || todo.category === 'litigation_initiate' || todo.category === 'evidence_review') {
      setActivePool('litigation')
    } else {
      setActivePool('receivable')
    }
  }

  const roleLabels: Record<UserRole, string> = {
    salesperson: '业务员',
    ops_manager: '运营经理',
    finance: '财务',
    legal: '法务',
    admin: '管理员',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">待办事项</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            当前角色：<span className="font-medium text-foreground">{roleLabels[currentRole]}</span>
            {' '}· 快速处理需要您审核确认的工作节点
          </p>
        </div>
        <div className="flex items-center gap-4">
          {urgentCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs font-semibold text-destructive">{urgentCount} 紧急</span>
            </div>
          )}
          {highCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10">
              <span className="text-xs font-semibold text-warning">{highCount} 高优</span>
            </div>
          )}
          <div className="text-right">
            <div className="text-sm text-muted-foreground">待处理</div>
            <div className="text-lg font-bold tabular-nums text-foreground">{visibleTodos.length} 条</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="stat-card cursor-pointer" onClick={() => setFilterCategory('all')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">全部待办</div>
                <div className="text-2xl font-bold tabular-nums text-foreground mt-1">{visibleTodos.length}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              涉及金额 <span className="font-semibold text-foreground">¥{formatNumber(totalAmount)}</span>
            </div>
          </CardContent>
        </Card>
        {visibleCategories.slice(0, 3).map(cat => {
          const config = categoryConfig[cat]
          const Icon = config.icon
          const count = visibleTodos.filter(t => t.category === cat).length
          return (
            <Card
              key={cat}
              className={cn("stat-card cursor-pointer", filterCategory === cat && "ring-1 ring-primary")}
              onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">{config.label}</div>
                    <div className={cn("text-2xl font-bold tabular-nums mt-1", config.color)}>{count}</div>
                  </div>
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.bgColor)}>
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mr-1">按类型筛选：</span>
        <button
          onClick={() => setFilterCategory('all')}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
            filterCategory === 'all' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          全部
        </button>
        {visibleCategories.map(cat => {
          const config = categoryConfig[cat]
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filterCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {config.label}
            </button>
          )
        })}
      </div>

      {/* Todo List */}
      <div className="space-y-3">
        {sortedTodos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium text-foreground">全部处理完毕</p>
              <p className="text-sm text-muted-foreground mt-1">当前没有待处理的事项</p>
            </CardContent>
          </Card>
        ) : (
          sortedTodos.map(todo => {
            const catConfig = categoryConfig[todo.category]
            const CatIcon = catConfig.icon
            const priConfig = priorityConfig[todo.priority]
            const isProcessing = todo.status === 'processing'

            return (
              <Card
                key={todo.id}
                className={cn(
                  "transition-all duration-200 hover:shadow-sm",
                  todo.priority === 'urgent' && "border-l-4 border-l-destructive",
                  todo.priority === 'high' && "border-l-4 border-l-warning",
                  isProcessing && "opacity-60"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg mt-0.5", catConfig.bgColor)}>
                      <CatIcon className={cn("h-5 w-5", catConfig.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={priConfig.variant} className="text-[10px]">{priConfig.label}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{catConfig.label}</Badge>
                        {isProcessing && <Badge variant="pool-receivable" className="text-[10px]">处理中</Badge>}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{todo.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{todo.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                        <span className="font-mono">{todo.relatedContract}</span>
                        <span>{todo.customer}</span>
                        <span className="font-semibold tabular-nums text-foreground">¥{formatNumber(todo.amount)}</span>
                        <span>截止: {todo.dueDate}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleNavigate(todo)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        查看
                      </Button>
                      {!isProcessing ? (
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleProcess(todo.id)}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          处理
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="success"
                          className="h-8 text-xs"
                          onClick={() => handleComplete(todo.id)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          完成
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
