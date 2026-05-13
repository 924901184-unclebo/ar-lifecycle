import { useState, useMemo } from 'react'
import {
  AlertTriangle, Phone, MapPin, Mail, MessageSquare,
  FileText, Upload, Shield, CheckCircle2, Clock, ArrowRight,
  Download, Plus, X, Eye, Users, Calculator, Scale, Send,
  Search, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatNumber } from '@/lib/utils'
import { receivables, evidenceItems, collectionRecords, poolConfigs } from '@/data/mockData'
import { showToast } from '@/components/ui/toast'
import { useApp } from '@/hooks/useApp'
import { PoolMetaPopover } from '@/components/ui/PoolMetaPopover'
import type { PoolLevel } from '@/types'

type ViewTab = 'ops' | 'finance' | 'legal'

/* Bad debt provision ratios per aging bucket */
const agingProvisionRates: Record<string, number> = {
  '1年内': 0.08,
  '1-2年': 0.15,
  '2-3年': 0.45,
  '3-4年': 0.60,
  '4-5年': 0.80,
  '5年以上': 1.00,
}

/* Map existing aging buckets to provision buckets */
function getProvisionBucket(agingDays: number): string {
  if (agingDays <= 365) return '1年内'
  if (agingDays <= 730) return '1-2年'
  if (agingDays <= 1095) return '2-3年'
  if (agingDays <= 1460) return '3-4年'
  if (agingDays <= 1825) return '4-5年'
  return '5年以上'
}

const methodIcons: Record<string, React.ElementType> = {
  phone: Phone,
  visit: MapPin,
  letter: Mail,
  email: Mail,
  wechat: MessageSquare,
}

const evidenceTypeLabels: Record<string, string> = {
  contract: '合同',
  invoice: '发票',
  delivery: '登版单/验收报告',
  collection: '催收记录',
  lawyer_letter: '律师函',
  court_doc: '法院文书',
  communication: '沟通记录',
}

/* 逾期原因记录 —— 针对每笔逾期期次可多次记录原因 */
interface OverdueReasonRecord {
  id: string
  installmentId: string  // 关联的期次 id
  reason: string         // 逾期原因
  detail?: string        // 补充说明
  recordDate: string     // 记录日期
  operator: string       // 记录人
}

const overdueReasonOptions = [
  '客户资金紧张',
  '对账存在争议',
  '客户经营困难',
  '联系人变更',
  '故意拖欠',
  '内部审批流程延迟',
  '发票问题',
  '其他',
]

/* 应收款项明细数据 —— 每笔逾期合同的分期/批次应收信息 */
interface ReceivableInstallment {
  id: string
  period: number       // 第几期
  totalPeriods: number // 总期数
  amount: number       // 本期应收金额
  dueDate: string      // 约定付款日
  paidAmount: number   // 已付金额
  status: '已回款' | '逾期' | '未到期'
  overdueDays?: number // 逾期天数
  invoiceNo?: string   // 对应发票号
  expectedPayDate?: string // 预计回款时间
}

const installmentData: Record<string, ReceivableInstallment[]> = {
  'AR-2026-004': [
    { id: 'INS-001', period: 1, totalPeriods: 3, amount: 960000, dueDate: '2025-11-30', paidAmount: 960000, status: '已回款', invoiceNo: 'INV-2025-0501-01' },
    { id: 'INS-002', period: 2, totalPeriods: 3, amount: 1120000, dueDate: '2026-02-28', paidAmount: 0, status: '逾期', overdueDays: 74, invoiceNo: 'INV-2025-0501-02', expectedPayDate: '2026-06-30' },
    { id: 'INS-003', period: 3, totalPeriods: 3, amount: 1120000, dueDate: '2026-05-31', paidAmount: 0, status: '未到期', invoiceNo: 'INV-2025-0501-03' },
  ],
  'AR-2026-005': [
    { id: 'INS-004', period: 1, totalPeriods: 2, amount: 840000, dueDate: '2025-09-30', paidAmount: 0, status: '逾期', overdueDays: 225, invoiceNo: 'INV-2024-1203-01', expectedPayDate: '2026-07-15' },
    { id: 'INS-005', period: 2, totalPeriods: 2, amount: 840000, dueDate: '2025-12-31', paidAmount: 0, status: '逾期', overdueDays: 133, invoiceNo: 'INV-2024-1203-02', expectedPayDate: '2026-08-30' },
  ],
  'AR-2026-006': [
    { id: 'INS-006', period: 1, totalPeriods: 4, amount: 1125000, dueDate: '2025-03-15', paidAmount: 1125000, status: '已回款', invoiceNo: 'INV-2024-0915-01' },
    { id: 'INS-007', period: 2, totalPeriods: 4, amount: 1125000, dueDate: '2025-06-15', paidAmount: 375000, status: '逾期', overdueDays: 332, invoiceNo: 'INV-2024-0915-02', expectedPayDate: '2026-06-15' },
    { id: 'INS-008', period: 3, totalPeriods: 4, amount: 1125000, dueDate: '2025-09-15', paidAmount: 0, status: '逾期', overdueDays: 240, invoiceNo: 'INV-2024-0915-03', expectedPayDate: '2026-07-30' },
    { id: 'INS-009', period: 4, totalPeriods: 4, amount: 1125000, dueDate: '2025-11-15', paidAmount: 0, status: '逾期', overdueDays: 179, invoiceNo: 'INV-2024-0915-04', expectedPayDate: '2026-09-15' },
  ],
  'AR-2026-012': [
    { id: 'INS-010', period: 1, totalPeriods: 3, amount: 933333, dueDate: '2025-10-20', paidAmount: 933333, status: '已回款', invoiceNo: 'INV-2025-0420-01' },
    { id: 'INS-011', period: 2, totalPeriods: 3, amount: 933333, dueDate: '2026-01-20', paidAmount: 266667, status: '逾期', overdueDays: 113, invoiceNo: 'INV-2025-0420-02', expectedPayDate: '2026-06-20' },
    { id: 'INS-012', period: 3, totalPeriods: 3, amount: 933334, dueDate: '2026-03-15', paidAmount: 0, status: '逾期', overdueDays: 59, invoiceNo: 'INV-2025-0420-03', expectedPayDate: '2026-07-15' },
  ],
}

/* 初始逾期原因记录 mock 数据 */
const initialReasonRecords: OverdueReasonRecord[] = [
  { id: 'RSN-001', installmentId: 'INS-002', reason: '客户资金紧张', detail: '客户反馈年后资金未到位，预计Q2回款', recordDate: '2026-03-15', operator: '王小明' },
  { id: 'RSN-002', installmentId: 'INS-002', reason: '内部审批流程延迟', detail: '客户内部走审批流程超过预期', recordDate: '2026-04-20', operator: '王小明' },
  { id: 'RSN-003', installmentId: 'INS-004', reason: '客户经营困难', detail: '该客户已出现裁员迹象', recordDate: '2026-01-10', operator: '李志强' },
  { id: 'RSN-004', installmentId: 'INS-005', reason: '客户经营困难', detail: '同上，二期款项也受影响', recordDate: '2026-02-05', operator: '李志强' },
  { id: 'RSN-005', installmentId: 'INS-007', reason: '对账存在争议', detail: '客户认为第二期投放效果未达到合同约定', recordDate: '2025-07-20', operator: '赵思远' },
  { id: 'RSN-006', installmentId: 'INS-008', reason: '故意拖欠', detail: '多次催收未果', recordDate: '2025-10-30', operator: '赵思远' },
  { id: 'RSN-007', installmentId: 'INS-009', reason: '故意拖欠', detail: '联系人拒绝接听', recordDate: '2025-12-15', operator: '赵思远' },
  { id: 'RSN-008', installmentId: 'INS-011', reason: '联系人变更', detail: '原对接人离职，新对接人不认之前账务', recordDate: '2026-02-28', operator: '陈静' },
  { id: 'RSN-009', installmentId: 'INS-012', reason: '联系人变更', detail: '同上，同一客户', recordDate: '2026-04-01', operator: '陈静' },
]

/* 手动添加的往年逾期数据 */
interface ManualOverdueItem {
  id: string
  contractNo: string
  customerName: string
  customerShort: string
  totalAmount: number
  remainingAmount: number
  receivedAmount: number
  invoicedAmount: number
  agingDays: number
  agingBucket: string
  dueDate: string
  salesperson: string
  department: string
  year: number           // 逾期所属年份
  notes: string
  addedBy: string
  addedAt: string
  isManual: true         // 标记为手动添加
  // 兼容 ReceivableItem 的字段
  poolLevel: 'overdue'
  status: string
  priority: 'high' | 'medium' | 'low'
  contractDate: string
  lastAction: string
  lastActionDate: string
  evidenceCount: number
  hasCollectionRecord: boolean
  hasLawyerLetter: boolean
}

/* 示例往年手动添加数据 */
const initialManualItems: ManualOverdueItem[] = [
  {
    id: 'MANUAL-001', contractNo: 'HT-2023-0088', customerName: '上海星辰文化传播有限公司',
    customerShort: '星辰文化', totalAmount: 680000, remainingAmount: 450000, receivedAmount: 230000, invoicedAmount: 680000,
    agingDays: 820, agingBucket: '2-3年', dueDate: '2024-02-28', salesperson: '王小明', department: '华东事业部', year: 2023,
    notes: '2023年户外广告投放欠款，多次催收未果', addedBy: '王小明', addedAt: '2026-04-10',
    isManual: true, poolLevel: 'overdue', status: '催收中', priority: 'high',
    contractDate: '2023-06-15', lastAction: '电话催收', lastActionDate: '2026-04-28',
    evidenceCount: 4, hasCollectionRecord: true, hasLawyerLetter: true,
  },
  {
    id: 'MANUAL-002', contractNo: 'HT-2022-0215', customerName: '深圳蓝海网络科技有限公司',
    customerShort: '蓝海网络', totalAmount: 1200000, remainingAmount: 780000, receivedAmount: 420000, invoicedAmount: 1200000,
    agingDays: 1150, agingBucket: '3-4年', dueDate: '2023-04-15', salesperson: '李志强', department: '华南事业部', year: 2022,
    notes: '2022年数字广告合作，客户经营困难拖欠至今', addedBy: '李志强', addedAt: '2026-03-20',
    isManual: true, poolLevel: 'overdue', status: '催收中', priority: 'high',
    contractDate: '2022-08-10', lastAction: '律师函', lastActionDate: '2026-03-15',
    evidenceCount: 5, hasCollectionRecord: true, hasLawyerLetter: true,
  },
  {
    id: 'MANUAL-003', contractNo: 'HT-2024-0142', customerName: '杭州启航品牌策划有限公司',
    customerShort: '启航品牌', totalAmount: 350000, remainingAmount: 200000, receivedAmount: 150000, invoicedAmount: 350000,
    agingDays: 480, agingBucket: '1-2年', dueDate: '2025-01-10', salesperson: '陈静', department: '华东事业部', year: 2024,
    notes: '2024年品牌策划项目尾款未付', addedBy: '陈静', addedAt: '2026-05-01',
    isManual: true, poolLevel: 'overdue', status: '协商中', priority: 'medium',
    contractDate: '2024-03-20', lastAction: '上门拜访', lastActionDate: '2026-04-15',
    evidenceCount: 3, hasCollectionRecord: true, hasLawyerLetter: false,
  },
]

/* 往年数据的分期信息 */
const manualInstallmentData: Record<string, ReceivableInstallment[]> = {
  'MANUAL-001': [
    { id: 'MINS-001', period: 1, totalPeriods: 2, amount: 340000, dueDate: '2023-09-30', paidAmount: 230000, status: '逾期', overdueDays: 820, invoiceNo: 'INV-2023-0088-01', expectedPayDate: '' },
    { id: 'MINS-002', period: 2, totalPeriods: 2, amount: 340000, dueDate: '2024-02-28', paidAmount: 0, status: '逾期', overdueDays: 820, invoiceNo: 'INV-2023-0088-02', expectedPayDate: '' },
  ],
  'MANUAL-002': [
    { id: 'MINS-003', period: 1, totalPeriods: 3, amount: 400000, dueDate: '2022-12-15', paidAmount: 400000, status: '已回款', invoiceNo: 'INV-2022-0215-01' },
    { id: 'MINS-004', period: 2, totalPeriods: 3, amount: 400000, dueDate: '2023-04-15', paidAmount: 20000, status: '逾期', overdueDays: 1150, invoiceNo: 'INV-2022-0215-02', expectedPayDate: '' },
    { id: 'MINS-005', period: 3, totalPeriods: 3, amount: 400000, dueDate: '2023-08-15', paidAmount: 0, status: '逾期', overdueDays: 1028, invoiceNo: 'INV-2022-0215-03', expectedPayDate: '' },
  ],
  'MANUAL-003': [
    { id: 'MINS-006', period: 1, totalPeriods: 2, amount: 175000, dueDate: '2024-08-10', paidAmount: 150000, status: '逾期', overdueDays: 480, invoiceNo: 'INV-2024-0142-01', expectedPayDate: '2026-08-01' },
    { id: 'MINS-007', period: 2, totalPeriods: 2, amount: 175000, dueDate: '2025-01-10', paidAmount: 0, status: '逾期', overdueDays: 480, invoiceNo: 'INV-2024-0142-02', expectedPayDate: '2026-09-01' },
  ],
}

export function OverduePage() {
  const { currentRole } = useApp()
  const [activeTab, setActiveTab] = useState<ViewTab>('ops')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [newRecordText, setNewRecordText] = useState('')
  
  /* 逾期原因管理状态 */
  const [reasonRecords, setReasonRecords] = useState<OverdueReasonRecord[]>(initialReasonRecords)
  const [addingReasonForIns, setAddingReasonForIns] = useState<string | null>(null)
  const [newReasonForm, setNewReasonForm] = useState({ reason: '客户资金紧张', detail: '' })

  /* 搜索和分页状态 */
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showLitigationModal, setShowLitigationModal] = useState(false)
  const [litigationDocsExpanded, setLitigationDocsExpanded] = useState(false)
  const pageSize = 5

  /* 手动添加往年逾期数据状态 */
  const [manualItems, setManualItems] = useState<ManualOverdueItem[]>(initialManualItems)
  const [showManualAddModal, setShowManualAddModal] = useState(false)
  const [listViewMode, setListViewMode] = useState<'current' | 'historical' | 'all'>('current')
  const [manualForm, setManualForm] = useState({
    contractNo: '',
    customerName: '',
    customerShort: '',
    totalAmount: '',
    remainingAmount: '',
    dueDate: '',
    salesperson: '',
    department: '华东事业部',
    year: '2024',
    notes: '',
  })

  const overdueItems = receivables.filter(r => r.poolLevel === 'overdue')

  /* 往年数据统计 */
  const historicalTotal = manualItems.reduce((s, m) => s + m.remainingAmount, 0)
  const currentYearTotal = overdueItems.reduce((s, r) => s + r.remainingAmount, 0)

  /* 搜索过滤 —— 按 viewMode 区分当年/往年/全部 */
  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase()
    if (listViewMode === 'historical') {
      // 仅往年手动数据 —— 转为兼容格式的列表项数组
      return [] // 往年数据单独渲染
    }
    const items = overdueItems
    if (!q) return items
    return items.filter(r =>
      r.contractNo.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.customerShort.toLowerCase().includes(q) ||
      r.salesperson.toLowerCase().includes(q)
    )
  }, [overdueItems, searchTerm, listViewMode])

  const filteredManualItems = useMemo(() => {
    const q = searchTerm.toLowerCase()
    if (listViewMode === 'current') return []
    if (!q) return manualItems
    return manualItems.filter(m =>
      m.contractNo.toLowerCase().includes(q) ||
      m.customerName.toLowerCase().includes(q) ||
      m.customerShort.toLowerCase().includes(q) ||
      m.salesperson.toLowerCase().includes(q)
    )
  }, [manualItems, searchTerm, listViewMode])

  /* 分页计算 —— 合并当年和往年数据用于分页，≥90天置顶 */
  const allDisplayItems = useMemo(() => {
    let items: Array<(typeof filteredItems[number] & { isManual: false }) | (typeof filteredManualItems[number] & { isManual: true })>
    if (listViewMode === 'current') {
      items = filteredItems.map(i => ({ ...i, isManual: false as const }))
    } else if (listViewMode === 'historical') {
      items = filteredManualItems.map(m => ({ ...m, isManual: true as const }))
    } else {
      items = [
        ...filteredItems.map(i => ({ ...i, isManual: false as const })),
        ...filteredManualItems.map(m => ({ ...m, isManual: true as const })),
      ]
    }
    // 符合诉讼条件（≥90天）置顶，内部按逾期天数降序
    return items.sort((a, b) => {
      const aLitigation = a.agingDays >= 90 ? 1 : 0
      const bLitigation = b.agingDays >= 90 ? 1 : 0
      if (aLitigation !== bLitigation) return bLitigation - aLitigation
      return b.agingDays - a.agingDays
    })
  }, [filteredItems, filteredManualItems, listViewMode])

  const totalPages = Math.max(1, Math.ceil(allDisplayItems.length / pageSize))
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return allDisplayItems.slice(start, start + pageSize)
  }, [allDisplayItems, currentPage, pageSize])

  const selectedItem = useMemo(() => {
    const id = selectedItemId || paginatedItems[0]?.id || null
    if (!id) return null
    // 先从系统数据中找
    const fromSystem = overdueItems.find(r => r.id === id)
    if (fromSystem) return { ...fromSystem, isManual: false as const }
    // 再从手动数据中找
    const fromManual = manualItems.find(m => m.id === id)
    if (fromManual) return fromManual
    return null
  }, [selectedItemId, paginatedItems, overdueItems, manualItems])

  /* 获取选中项的分期数据（合并系统+手动） */
  const selectedInstallments = useMemo(() => {
    if (!selectedItem) return null
    return installmentData[selectedItem.id] || manualInstallmentData[selectedItem.id] || null
  }, [selectedItem])

  const tabs: { key: ViewTab; label: string; icon: React.ElementType; roleMatch: string[] }[] = [
    { key: 'ops', label: '运营/业务视角', icon: Users, roleMatch: ['ops_manager', 'salesperson', 'admin'] },
    { key: 'finance', label: '财务视角', icon: Calculator, roleMatch: ['finance', 'admin'] },
    { key: 'legal', label: '法务视角', icon: Scale, roleMatch: ['legal', 'admin'] },
  ]

  /* Evidence for selected item */
  const itemEvidence = selectedItem ? evidenceItems.filter(e => e.receivableId === selectedItem.id) : []
  const itemCollection = selectedItem ? collectionRecords.filter(c => c.receivableId === selectedItem.id) : []

  /* Evidence completeness */
  const requiredTypes = ['contract', 'invoice', 'delivery', 'collection']
  const existingTypes = new Set(itemEvidence.map(e => e.type))
  const completedCount = requiredTypes.filter(t => existingTypes.has(t)).length
  const completionPct = (completedCount / requiredTypes.length) * 100

  /* Financial calculations */
  const provisionBucket = selectedItem ? getProvisionBucket(selectedItem.agingDays) : '1年内'
  const provisionRate = agingProvisionRates[provisionBucket]
  const provisionAmount = selectedItem ? selectedItem.remainingAmount * provisionRate : 0

  const handleAddCollectionRecord = () => {
    if (!newRecordText.trim()) {
      showToast('请输入催收记录内容', 'warning')
      return
    }
    showToast('催收记录已添加', 'success')
    setNewRecordText('')
    setShowAddRecord(false)
  }

  /* 添加逾期原因 */
  const handleAddReason = (installmentId: string) => {
    if (!newReasonForm.reason) {
      showToast('请选择逾期原因', 'warning')
      return
    }
    const newRecord: OverdueReasonRecord = {
      id: `RSN-${Date.now()}`,
      installmentId,
      reason: newReasonForm.reason,
      detail: newReasonForm.detail || undefined,
      recordDate: new Date().toISOString().slice(0, 10),
      operator: currentRole === 'ops_manager' ? '运营经理' : currentRole === 'salesperson' ? '业务员' : '管理员',
    }
    setReasonRecords(prev => [...prev, newRecord])
    setAddingReasonForIns(null)
    setNewReasonForm({ reason: '客户资金紧张', detail: '' })
    showToast('逾期原因已记录', 'success')
  }

  /* 获取指定期次的原因记录 */
  const getReasonsForInstallment = (insId: string) => {
    return reasonRecords.filter(r => r.installmentId === insId)
  }

  /* 针对单笔逾期期次发送催款函 */
  const handleSendLetter = (ins: ReceivableInstallment) => {
    showToast(`第${ins.period}期催款函已生成（¥${formatNumber(ins.amount - ins.paidAmount)}），等待电子签章...`, 'success')
  }

  /* 发起诉讼申请 */
  const handleInitiateLitigation = () => {
    setShowLitigationModal(false)
    showToast('诉讼申请已提交，等待法务审核 → 管理层审批...', 'success')
  }

  /* 手动添加往年逾期数据 */
  const handleManualAdd = () => {
    if (!manualForm.contractNo || !manualForm.customerName || !manualForm.remainingAmount) {
      showToast('请填写合同号、客户名称和剩余欠款金额', 'warning')
      return
    }
    const agingDays = Math.floor((Date.now() - new Date(manualForm.dueDate || '2024-01-01').getTime()) / 86400000)
    const totalAmt = Number(manualForm.totalAmount) || 0
    const remainAmt = Number(manualForm.remainingAmount) || 0
    const newItem: ManualOverdueItem = {
      id: `MANUAL-${Date.now()}`,
      contractNo: manualForm.contractNo,
      customerName: manualForm.customerName,
      customerShort: manualForm.customerShort || manualForm.customerName.slice(0, 4),
      totalAmount: totalAmt,
      remainingAmount: remainAmt,
      receivedAmount: totalAmt - remainAmt,
      invoicedAmount: totalAmt,
      agingDays,
      agingBucket: getProvisionBucket(agingDays),
      dueDate: manualForm.dueDate || '2024-01-01',
      salesperson: manualForm.salesperson || '未指定',
      department: manualForm.department,
      year: Number(manualForm.year) || 2024,
      notes: manualForm.notes,
      addedBy: '当前用户',
      addedAt: new Date().toISOString().slice(0, 10),
      isManual: true,
      poolLevel: 'overdue',
      status: '催收中',
      priority: agingDays > 365 ? 'high' : 'medium',
      contractDate: `${manualForm.year}-01-01`,
      lastAction: '手动录入',
      lastActionDate: new Date().toISOString().slice(0, 10),
      evidenceCount: 0,
      hasCollectionRecord: false,
      hasLawyerLetter: false,
    }
    setManualItems(prev => [...prev, newItem])
    setShowManualAddModal(false)
    setManualForm({
      contractNo: '', customerName: '', customerShort: '', totalAmount: '',
      remainingAmount: '', dueDate: '', salesperson: '', department: '华东事业部',
      year: '2024', notes: '',
    })
    showToast('往年逾期数据已添加成功', 'success')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="pool-overdue" className="text-xs">Level 3</Badge>
            <h1 className="text-2xl font-bold text-foreground">逾期应收 · 协同中心</h1>
            <PoolMetaPopover config={poolConfigs.find(p => p.key === 'overdue')!} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">跨部门协同管理，运营催收 + 财务核对 + 法务评估</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="pool-overdue">{overdueItems.length + manualItems.length} 笔逾期</Badge>
            {manualItems.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">含往年 {manualItems.length} 笔</Badge>
            )}
          </div>
          <span className="text-lg font-bold tabular-nums text-foreground">
            ¥{formatNumber(currentYearTotal + historicalTotal)}
          </span>
          {(currentRole === 'ops_manager' || currentRole === 'admin') && (
            <Button
              size="sm"
              onClick={() => setShowManualAddModal(true)}
              className="h-8 px-4 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200/50 dark:shadow-amber-900/30 border-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              添加往年数据
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Left: Item list with search & pagination */}
        <div className="lg:col-span-1 space-y-2">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索合同号、客户..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-8 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setCurrentPage(1) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* 数据切换 Tab: 当年 / 往年 / 全部 */}
          <div className="flex items-center gap-0 p-1 rounded-lg bg-muted/60 border border-border shadow-inner">
            {([
              { key: 'current' as const, label: '当年数据', count: overdueItems.length, color: 'text-pool-overdue', activeBg: 'bg-white dark:bg-zinc-800 border-pool-overdue/30 shadow-md' },
              { key: 'historical' as const, label: '往年数据', count: manualItems.length, color: 'text-amber-600 dark:text-amber-400', activeBg: 'bg-white dark:bg-zinc-800 border-amber-400/40 shadow-md' },
              { key: 'all' as const, label: '全部', count: overdueItems.length + manualItems.length, color: 'text-foreground', activeBg: 'bg-white dark:bg-zinc-800 border-border shadow-md' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => { setListViewMode(tab.key); setCurrentPage(1) }}
                className={cn(
                  "flex-1 text-xs font-semibold py-1.5 px-2 rounded-md transition-all duration-200 border",
                  listViewMode === tab.key
                    ? `${tab.activeBg} ${tab.color}`
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>{tab.label}</span>
                  <span className={cn(
                    "text-[10px] font-bold tabular-nums",
                    listViewMode === tab.key ? "opacity-100" : "opacity-50"
                  )}>
                    {tab.count} 笔
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* 列表标题和结果统计 */}
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {listViewMode === 'historical' ? '往年逾期' : listViewMode === 'current' ? '当年逾期' : '全部逾期'}
            </div>
            <span className="text-[10px] text-muted-foreground">{allDisplayItems.length} 条</span>
          </div>

          {/* 列表项 */}
          {paginatedItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              未找到匹配的合同
            </div>
          ) : (
            paginatedItems.map((item, idx) => {
              const isActive = selectedItem?.id === item.id
              const isHistorical = item.isManual
              const isLitigationReady = item.agingDays >= 90
              // 在置顶项与非置顶项之间插入分割线
              const prevItem = idx > 0 ? paginatedItems[idx - 1] : null
              const showDivider = prevItem && prevItem.agingDays >= 90 && item.agingDays < 90
              return (
                <div key={item.id}>
                  {showDivider && (
                    <div className="flex items-center gap-2 py-1.5 px-1">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">以下未达诉讼条件</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedItemId(item.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-all duration-200",
                      isActive
                        ? isHistorical
                          ? "border-amber-500/30 bg-amber-50/50 shadow-sm dark:bg-amber-950/20"
                          : "border-pool-overdue/30 bg-pool-overdue-muted/50 shadow-sm"
                        : isLitigationReady && !isHistorical
                          ? "border-destructive/30 bg-destructive/[0.03] hover:bg-destructive/[0.06] shadow-sm"
                          : "border-border hover:border-border hover:bg-muted/30",
                      isHistorical && !isActive && "border-l-2 border-l-amber-400/60",
                      isLitigationReady && !isActive && !isHistorical && "border-l-2 border-l-destructive/60"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {isLitigationReady && !isHistorical && (
                          <Scale className="h-3 w-3 text-destructive shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-foreground">{item.customerShort}</span>
                        {isHistorical && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {'year' in item ? `${item.year}年` : '往年'}
                          </Badge>
                        )}
                        {isLitigationReady && !isHistorical && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0">
                            可诉讼
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant={isLitigationReady ? "destructive" : isHistorical ? "secondary" : "pool-overdue"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {item.agingDays}天
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{item.contractNo}</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className={cn("text-sm font-bold tabular-nums", isHistorical ? "text-amber-600 dark:text-amber-400" : "text-pool-overdue")}>
                        ¥{formatNumber(item.remainingAmount)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {isHistorical ? '手动录入' : 'status' in item ? item.status : ''}
                      </span>
                    </div>
                  </button>
                </div>
              )
            })
          )}

          {/* 分页控件 */}
          {allDisplayItems.length > pageSize && (
            <div className="flex items-center justify-between pt-2 px-1 border-t border-border">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "flex items-center gap-0.5 text-xs px-2 py-1 rounded transition-colors",
                  currentPage === 1
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <ChevronLeft className="h-3 w-3" />
                上一页
              </button>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "flex items-center gap-0.5 text-xs px-2 py-1 rounded transition-colors",
                  currentPage === totalPages
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                下一页
                <ChevronRightIcon className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Detail with tabs */}
        <div className="lg:col-span-3 min-w-0">
          {selectedItem ? (
            <Card>
              {/* Item summary header */}
              <CardHeader className="border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{selectedItem.customerName}</CardTitle>
                      {selectedItem.isManual && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          往年数据 · {('year' in selectedItem) ? selectedItem.year : ''}年
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="font-mono">{selectedItem.contractNo}</span>
                      <span>·</span>
                      <span>逾期 {selectedItem.agingDays} 天</span>
                      <span>·</span>
                      <span>负责人：{selectedItem.salesperson}</span>
                      {selectedItem.isManual && 'addedAt' in selectedItem && (
                        <>
                          <span>·</span>
                          <span className="text-amber-600 dark:text-amber-400">录入于 {selectedItem.addedAt}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-2xl font-bold tabular-nums", selectedItem.isManual ? "text-amber-600 dark:text-amber-400" : "text-pool-overdue")}>
                      ¥{formatNumber(selectedItem.remainingAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">待收金额</div>
                  </div>
                </div>

                {/* Tab navigation */}
                <div className="flex gap-1 mt-4 -mb-3 border-b-0">
                  {tabs.map(tab => {
                    const Icon = tab.icon
                    const isVisible = tab.roleMatch.includes(currentRole)
                    if (!isVisible) return null
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all border border-b-0",
                          activeTab === tab.key
                            ? "bg-card text-primary border-border -mb-px"
                            : "text-muted-foreground hover:text-foreground border-transparent"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* 应收款项明细 - 展示每笔合同的分期/批次信息 */}
                {selectedInstallments && (
                  <div className="mb-6 rounded-lg border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">应收款项明细</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>共 <span className="font-semibold text-foreground">{selectedInstallments[0]?.totalPeriods}</span> 期</span>
                        <span>·</span>
                        <span>逾期 <span className="font-semibold text-pool-overdue">{selectedInstallments.filter(i => i.status === '逾期').length}</span> 期</span>
                        <span>·</span>
                        <span>
                          逾期金额 <span className="font-semibold text-pool-overdue">
                            ¥{formatNumber(selectedInstallments.filter(i => i.status === '逾期').reduce((s, i) => s + (i.amount - i.paidAmount), 0))}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="data-table min-w-[600px]">
                      <thead>
                        <tr>
                          <th className="w-[80px]">期次</th>
                          <th>约定付款日</th>
                          <th>本期应收</th>
                          <th>已付金额</th>
                          <th>欠款余额</th>
                          <th>状态</th>
                          <th>逾期天数</th>
                          <th>预计回款</th>
                          <th>逾期原因</th>
                          <th className="w-[60px]">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInstallments.map(ins => {
                          const reasons = getReasonsForInstallment(ins.id)
                          const isOverdue = ins.status === '逾期'
                          return (
                            <tr key={ins.id} className={cn(
                              isOverdue && "bg-pool-overdue-muted/30"
                            )}>
                              <td className="text-sm font-medium">
                                <span className="text-foreground">第{ins.period}期</span>
                                <span className="text-muted-foreground text-[10px] ml-0.5">/{ins.totalPeriods}期</span>
                              </td>
                              <td className="text-sm tabular-nums">{ins.dueDate}</td>
                              <td className="text-sm tabular-nums font-medium">¥{formatNumber(ins.amount)}</td>
                              <td className="text-sm tabular-nums text-success">¥{formatNumber(ins.paidAmount)}</td>
                              <td className="text-sm tabular-nums font-semibold text-pool-overdue">
                                ¥{formatNumber(ins.amount - ins.paidAmount)}
                              </td>
                              <td>
                                <Badge
                                  variant={ins.status === '已回款' ? 'success' : ins.status === '逾期' ? 'destructive' : 'secondary'}
                                  className="text-[10px]"
                                >
                                  {ins.status}
                                </Badge>
                              </td>
                              <td className={cn(
                                "text-sm tabular-nums",
                                ins.overdueDays && ins.overdueDays > 90 ? "text-destructive font-semibold" : "text-pool-overdue"
                              )}>
                                {ins.overdueDays ? `${ins.overdueDays}天` : '-'}
                              </td>
                              <td className="min-w-[120px]">
                                {isOverdue ? (
                                  <input
                                    type="date"
                                    defaultValue={ins.expectedPayDate || ''}
                                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs tabular-nums focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                                    onChange={() => showToast('预计回款时间已更新', 'success')}
                                  />
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="min-w-[180px]">
                                {isOverdue ? (
                                  <div className="space-y-1">
                                    {reasons.length > 0 ? (
                                      reasons.map(r => (
                                        <div key={r.id} className="flex items-center gap-1">
                                          <Badge variant="warning" className="text-[9px] px-1 py-0 shrink-0">{r.reason}</Badge>
                                          <span className="text-[10px] text-muted-foreground truncate max-w-[80px]" title={r.detail}>{r.detail}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground italic">未记录</span>
                                    )}
                                    <button
                                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                      onClick={() => setAddingReasonForIns(ins.id)}
                                    >
                                      <Plus className="h-2.5 w-2.5" />添加原因
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">-</span>
                                )}
                              </td>
                              <td>
                                {isOverdue ? (
                                  <button
                                    className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline font-medium"
                                    onClick={() => handleSendLetter(ins)}
                                  >
                                    <Send className="h-2.5 w-2.5" />发函
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    </div>
                    {addingReasonForIns && (() => {
                      const allInstallments = Object.values(installmentData).flat()
                      const targetIns = allInstallments.find(i => i.id === addingReasonForIns)
                      return (
                        <div className="mt-3 mx-4 mb-4 rounded-lg border border-primary/20 bg-primary/[0.02] p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-foreground">
                              添加逾期原因 — 第{targetIns?.period}期 (到期日: {targetIns?.dueDate})
                            </h4>
                            <button onClick={() => setAddingReasonForIns(null)} className="text-muted-foreground hover:text-foreground">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">逾期原因分类</label>
                              <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newReasonForm.reason}
                                onChange={e => setNewReasonForm(prev => ({ ...prev, reason: e.target.value }))}
                              >
                                {overdueReasonOptions.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">补充说明</label>
                              <input
                                type="text"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="请补充逾期具体情况..."
                                value={newReasonForm.detail}
                                onChange={e => setNewReasonForm(prev => ({ ...prev, detail: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-3">
                            <Button variant="outline" size="sm" onClick={() => setAddingReasonForIns(null)}>取消</Button>
                            <Button size="sm" onClick={() => handleAddReason(addingReasonForIns)}>
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              确认添加
                            </Button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Ops/Business View */}
                {activeTab === 'ops' && (
                  <div className="space-y-6">
                    {/* Collection records */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground">沟通/催收记录</h3>
                        <Button size="sm" variant="outline" onClick={() => setShowAddRecord(true)}>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          新增记录
                        </Button>
                      </div>

                      {/* Add record form */}
                      {showAddRecord && (
                        <div className="mb-3 rounded-lg border border-primary/20 bg-primary/[0.02] p-3 space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <select className="rounded-md border border-input bg-background px-2 py-1.5 text-xs">
                              <option>电话催收</option>
                              <option>上门拜访</option>
                              <option>发送催款函</option>
                              <option>微信沟通</option>
                              <option>邮件催收</option>
                            </select>
                            <input type="date" className="rounded-md border border-input bg-background px-2 py-1.5 text-xs" defaultValue="2026-05-13" />
                            <input type="text" placeholder="下次跟进日期" className="rounded-md border border-input bg-background px-2 py-1.5 text-xs" />
                          </div>
                          <textarea
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                            rows={2}
                            placeholder="请输入催收结果和备注..."
                            value={newRecordText}
                            onChange={e => setNewRecordText(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowAddRecord(false)}>取消</Button>
                            <Button size="sm" onClick={handleAddCollectionRecord}>保存</Button>
                          </div>
                        </div>
                      )}

                      {/* Existing records */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {itemCollection.length === 0 ? (
                          <div className="text-center py-6 text-sm text-muted-foreground">暂无催收记录</div>
                        ) : (
                          itemCollection.map(record => {
                            const Icon = methodIcons[record.method] || Phone
                            return (
                              <div key={record.id} className="rounded-lg border border-border p-3">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                                      <Icon className="h-3 w-3 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium">{record.methodLabel}</span>
                                    <span className="text-[10px] text-muted-foreground">{record.date}</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">{record.operator}</span>
                                </div>
                                <p className="text-sm text-foreground ml-8">{record.result}</p>
                                {record.notes && (
                                  <p className="text-xs text-muted-foreground ml-8 mt-1 italic">{record.notes}</p>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>

                    {/* 诉讼资料完善 —— 逾期≥60天时提示提前准备，默认折叠 */}
                    {selectedItem && selectedItem.agingDays >= 60 && (() => {
                      const docsCompletedCount = selectedItem.agingDays > 150 ? 5 : selectedItem.agingDays > 100 ? 4 : 2
                      return (
                        <div className="rounded-lg border border-border overflow-hidden">
                          {/* 可点击的头部 —— 始终可见，含进度 */}
                          <div
                            className="flex items-center justify-between px-4 py-3 bg-muted/40 cursor-pointer select-none hover:bg-muted/60 transition-colors"
                            onClick={() => setLitigationDocsExpanded(prev => !prev)}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-pool-litigation" />
                              <span className="text-sm font-semibold text-foreground">诉讼资料完善</span>
                              {selectedItem.agingDays >= 90 ? (
                                <Badge variant="destructive" className="text-[10px]">请尽快完善</Badge>
                              ) : (
                                <Badge variant="warning" className="text-[10px]">提前准备</Badge>
                              )}
                              {/* 折叠态时在标题旁显示进度 */}
                              <div className="flex items-center gap-2 ml-2">
                                <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      docsCompletedCount >= 5 ? "bg-success" : docsCompletedCount >= 4 ? "bg-warning" : "bg-muted-foreground/30"
                                    )}
                                    style={{ width: `${docsCompletedCount / 7 * 100}%` }}
                                  />
                                </div>
                                <span className={cn(
                                  "text-[11px] font-medium",
                                  docsCompletedCount >= 5 ? "text-success" : docsCompletedCount >= 4 ? "text-warning" : "text-muted-foreground"
                                )}>
                                  {docsCompletedCount}/7
                                </span>
                              </div>
                            </div>
                            <ChevronDown className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform duration-200",
                              litigationDocsExpanded && "rotate-180"
                            )} />
                          </div>

                          {/* 展开态 —— 详细文档清单 */}
                          {litigationDocsExpanded && (
                            <div className="p-4 space-y-2.5 border-t border-border">
                              <div className="text-[11px] text-muted-foreground mb-3">
                                逾期≥60天建议提前准备，进入诉讼后可直接下载资料包
                              </div>
                              {[
                                { id: 'doc-contract', label: '合同原件/扫描件', desc: '含签章页', required: true, uploaded: true },
                                { id: 'doc-invoice', label: '发票及签收单', desc: '所有已开发票', required: true, uploaded: true },
                                { id: 'doc-delivery', label: '交付验收证明', desc: '登版单/排期确认/验收报告', required: true, uploaded: selectedItem.agingDays > 100 },
                                { id: 'doc-collection', label: '催收记录汇总', desc: '电话/上门/函件等催收凭证', required: true, uploaded: selectedItem.agingDays > 100 },
                                { id: 'doc-letter', label: '律师函/催款函', desc: '已发送的正式函件及签收凭证', required: true, uploaded: selectedItem.agingDays > 150 },
                                { id: 'doc-account', label: '对账单/欠款确认书', desc: '双方确认的应收金额', required: false, uploaded: false },
                                { id: 'doc-communication', label: '沟通记录截图', desc: '微信/邮件/短信等沟通证据', required: false, uploaded: selectedItem.agingDays > 200 },
                              ].map(doc => {
                                const isReady = doc.uploaded
                                return (
                                  <div key={doc.id} className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2.5 border transition-colors",
                                    isReady ? "border-success/20 bg-success/[0.02]" : "border-border bg-background"
                                  )}>
                                    {isReady ? (
                                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className={cn("text-sm font-medium", isReady ? "text-foreground" : "text-muted-foreground")}>
                                          {doc.label}
                                        </span>
                                        {doc.required && <span className="text-[9px] text-destructive font-medium">必需</span>}
                                      </div>
                                      <span className="text-[11px] text-muted-foreground">{doc.desc}</span>
                                    </div>
                                    {isReady ? (
                                      <button
                                        className="flex items-center gap-1.5 shrink-0 text-[11px] font-medium text-success hover:text-success/80 transition-colors cursor-pointer group"
                                        onClick={(e) => { e.stopPropagation(); showToast(`正在预览「${doc.label}」...`, 'info') }}
                                        title={`预览${doc.label}`}
                                      >
                                        <Eye className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                                        <span>预览</span>
                                      </button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs shrink-0"
                                        onClick={(e) => { e.stopPropagation(); showToast(`${doc.label}上传功能（演示模式）`, 'info') }}
                                      >
                                        <Upload className="h-3 w-3 mr-1" />
                                        上传
                                      </Button>
                                    )}
                                  </div>
                                )
                              })}
                              {/* 完善进度和下载 */}
                              <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                                <div className="flex items-center gap-3">
                                  <div className="text-xs text-muted-foreground">
                                    资料完善度：
                                    <span className={cn(
                                      "font-bold ml-1",
                                      docsCompletedCount >= 5 ? "text-success" : docsCompletedCount >= 4 ? "text-warning" : "text-muted-foreground"
                                    )}>
                                      {docsCompletedCount}/7
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all",
                                        docsCompletedCount >= 5 ? "bg-success" : docsCompletedCount >= 4 ? "bg-warning" : "bg-muted-foreground/30"
                                      )}
                                      style={{ width: `${docsCompletedCount / 7 * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={(e) => { e.stopPropagation(); showToast('正在打包已上传的诉讼资料...', 'success') }}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  下载资料包
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* 诉讼流转操作区 */}
                    {selectedItem && selectedItem.agingDays >= 90 && (
                      <div className="rounded-lg border border-pool-litigation/30 bg-pool-litigation/[0.02] p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pool-litigation/10">
                              <Scale className="h-4.5 w-4.5 text-pool-litigation" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">催收无果？发起诉讼程序</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                逾期已超 {selectedItem.agingDays} 天，可将本合同转入诉讼/仲裁池处理
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setShowLitigationModal(true)}
                          >
                            <Scale className="h-3.5 w-3.5 mr-1.5" />
                            发起诉讼
                          </Button>
                        </div>
                        {/* 流程说明 */}
                        <div className="mt-3 pt-3 border-t border-pool-litigation/20">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="h-4 w-4 rounded-full bg-pool-overdue/20 text-pool-overdue text-[9px] font-bold inline-flex items-center justify-center">1</span>运营发起</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="flex items-center gap-1"><span className="h-4 w-4 rounded-full bg-pool-litigation/20 text-pool-litigation text-[9px] font-bold inline-flex items-center justify-center">2</span>法务审核</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="flex items-center gap-1"><span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold inline-flex items-center justify-center">3</span>管理层审批</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="flex items-center gap-1"><span className="h-4 w-4 rounded-full bg-success/20 text-success text-[9px] font-bold inline-flex items-center justify-center">4</span>转入诉讼池</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Finance View */}
                {activeTab === 'finance' && (
                  <div className="space-y-6">
                    {/* Amount reconciliation */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: '合同金额', value: selectedItem.totalAmount, color: 'text-foreground' },
                        { label: '已开票', value: selectedItem.invoicedAmount, color: 'text-primary' },
                        { label: '已回款', value: selectedItem.receivedAmount, color: 'text-success' },
                        { label: '欠款金额', value: selectedItem.remainingAmount, color: 'text-pool-overdue' },
                      ].map(item => (
                        <div key={item.label} className="rounded-lg bg-muted/50 p-3 text-center">
                          <div className="text-[10px] text-muted-foreground">{item.label}</div>
                          <div className={cn("text-lg font-bold tabular-nums mt-1", item.color)}>
                            ¥{formatNumber(item.value)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bad debt provision calculation */}
                    <Card className="border-warning/20 bg-warning/[0.02]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-warning" />
                          坏账计提计算
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">账龄区间</div>
                              <div className="font-semibold text-foreground mt-0.5">{provisionBucket}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">计提比例</div>
                              <div className="font-semibold text-warning mt-0.5">{(provisionRate * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">计提金额</div>
                              <div className="font-semibold text-pool-overdue mt-0.5">¥{formatNumber(provisionAmount)}</div>
                            </div>
                          </div>

                          {/* Provision rate table */}
                          <div className="mt-3 border-t border-border pt-3">
                            <div className="text-xs font-medium text-muted-foreground mb-2">坏账计提比例参照表</div>
                            <div className="grid grid-cols-6 gap-1 text-center">
                              {Object.entries(agingProvisionRates).map(([bucket, rate]) => (
                                <div key={bucket} className={cn(
                                  "rounded px-1 py-1.5",
                                  bucket === provisionBucket ? "bg-warning/10 ring-1 ring-warning/30" : "bg-muted/50"
                                )}>
                                  <div className="text-[9px] text-muted-foreground leading-tight">{bucket}</div>
                                  <div className={cn(
                                    "text-xs font-bold mt-0.5",
                                    bucket === provisionBucket ? "text-warning" : "text-foreground"
                                  )}>
                                    {(rate * 100).toFixed(0)}%
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment details */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">回款明细</h3>
                      <div className="rounded-lg border border-border overflow-x-auto">
                        <table className="data-table min-w-[500px]">
                          <thead>
                            <tr>
                              <th>回款日期</th>
                              <th>金额</th>
                              <th>方式</th>
                              <th>凭证号</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedItem.receivedAmount > 0 ? (
                              <tr>
                                <td className="text-xs">2025-12-20</td>
                                <td className="tabular-nums font-medium text-success">¥{formatNumber(selectedItem.receivedAmount)}</td>
                                <td className="text-xs">银行转账</td>
                                <td className="font-mono text-xs text-muted-foreground">TXN20251220-001</td>
                              </tr>
                            ) : (
                              <tr>
                                <td colSpan={4} className="text-center text-muted-foreground py-4">暂无回款记录</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legal View */}
                {activeTab === 'legal' && (
                  <div className="space-y-6">
                    {/* Evidence chain completeness */}
                    <Card className={cn(
                      "border",
                      completionPct === 100
                        ? "border-success/30 bg-success/[0.02]"
                        : "border-warning/30 bg-warning/[0.02]"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Shield className={cn(
                              "h-5 w-5",
                              completionPct === 100 ? "text-success" : "text-warning"
                            )} />
                            <span className="font-semibold text-foreground">
                              证据链完整性
                            </span>
                          </div>
                          <span className={cn(
                            "text-lg font-bold tabular-nums",
                            completionPct === 100 ? "text-success" : "text-warning"
                          )}>
                            {completionPct.toFixed(0)}%
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 w-full rounded-full bg-muted mb-3">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              completionPct === 100 ? "bg-success" : "bg-warning"
                            )}
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                        {/* Required evidence checklist */}
                        <div className="grid grid-cols-2 gap-2">
                          {requiredTypes.map(type => {
                            const has = existingTypes.has(type)
                            return (
                              <div key={type} className={cn(
                                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                                has ? "bg-success/5" : "bg-muted"
                              )}>
                                {has ? (
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-warning" />
                                )}
                                <span className={has ? "text-foreground" : "text-muted-foreground"}>
                                  {evidenceTypeLabels[type]}
                                </span>
                                <Badge variant={has ? 'success' : 'warning'} className="ml-auto text-[10px]">
                                  {has ? '已获取' : '缺失'}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Evidence management area */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground">证据材料管理</h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => showToast('文件上传功能（演示模式）', 'info')}>
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            手动上传
                          </Button>
                          <Button size="sm" onClick={() => showToast('正在打包导出证据材料...', 'success')}>
                            <Download className="h-3.5 w-3.5 mr-1" />
                            一键导出证据包
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Auto-fetched evidence */}
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          系统自动获取
                        </div>
                        {itemEvidence.filter(e => e.uploadedBy === '系统自动').map(ev => (
                          <div key={ev.id} className="flex items-center gap-3 rounded-md border border-success/20 bg-success/[0.02] px-3 py-2">
                            <FileText className="h-4 w-4 text-success shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{ev.fileName}</div>
                              <div className="text-[10px] text-muted-foreground">{ev.typeLabel} · {ev.fileSize} · {ev.uploadedAt}</div>
                            </div>
                            <Badge variant="success" className="text-[10px]">自动同步</Badge>
                            <Eye className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-primary" />
                          </div>
                        ))}

                        {/* Manually uploaded evidence */}
                        {itemEvidence.filter(e => e.uploadedBy !== '系统自动').length > 0 && (
                          <>
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">
                              手动上传
                            </div>
                            {itemEvidence.filter(e => e.uploadedBy !== '系统自动').map(ev => (
                              <div key={ev.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                                <FileText className="h-4 w-4 text-primary shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{ev.fileName}</div>
                                  <div className="text-[10px] text-muted-foreground">{ev.typeLabel} · {ev.uploadedBy} · {ev.fileSize}</div>
                                </div>
                                {ev.verified ? (
                                  <Badge variant="success" className="text-[10px]">已验证</Badge>
                                ) : (
                                  <Badge variant="warning" className="text-[10px]">待验证</Badge>
                                )}
                                <Eye className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-primary" />
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Litigation feasibility */}
                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        disabled={completionPct < 100}
                        onClick={() => setShowLitigationModal(true)}
                      >
                        <Scale className="h-3.5 w-3.5 mr-1.5" />
                        发起诉讼申请
                      </Button>
                      {completionPct < 100 && (
                        <span className="text-xs text-warning">证据链不完整，无法发起诉讼</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              请选择一条逾期记录查看详情
            </div>
          )}
        </div>
      </div>

      {/* 诉讼发起确认弹窗 */}
      {showLitigationModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowLitigationModal(false)} />
          <div className="relative w-[520px] rounded-xl border border-border bg-card shadow-xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pool-litigation/10">
                  <Scale className="h-5 w-5 text-pool-litigation" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">确认发起诉讼申请</h3>
                  <p className="text-xs text-muted-foreground">该操作将把合同流转至诉讼/仲裁池</p>
                </div>
              </div>
              <button onClick={() => setShowLitigationModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* 合同信息 */}
              <div className="rounded-lg bg-muted/50 p-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">客户名称</span>
                  <div className="font-medium">{selectedItem.customerName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">合同编号</span>
                  <div className="font-mono text-xs">{selectedItem.contractNo}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">逾期金额</span>
                  <div className="font-bold text-pool-overdue">¥{formatNumber(selectedItem.remainingAmount)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">逾期天数</span>
                  <div className="font-bold text-destructive">{selectedItem.agingDays} 天</div>
                </div>
              </div>

              {/* 审批流程说明 */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">审批流程</div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  {[
                    { step: '运营发起', desc: '提交申请', color: 'bg-pool-overdue text-white', active: true },
                    { step: '法务审核', desc: '评估胜诉率', color: 'bg-pool-litigation/20 text-pool-litigation', active: false },
                    { step: '管理层审批', desc: '费用确认', color: 'bg-primary/20 text-primary', active: false },
                    { step: '转入诉讼池', desc: '正式立案', color: 'bg-success/20 text-success', active: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground/50 -ml-1" />}
                      <div className="text-center">
                        <div className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold", s.color)}>
                          {i + 1}
                        </div>
                        <div className="text-[10px] font-medium text-foreground mt-1">{s.step}</div>
                        <div className="text-[9px] text-muted-foreground">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 申请说明 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">诉讼申请说明</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                  rows={2}
                  placeholder="请简要说明诉讼原因和诉求（如：多次催收无果，拟起诉要求支付全部欠款及逾期利息）..."
                  defaultValue={`该客户逾期${selectedItem.agingDays}天，经多次催收无果，申请启动诉讼程序追回欠款¥${formatNumber(selectedItem.remainingAmount)}。`}
                />
              </div>

              {/* 前置条件检查 */}
              <div className="rounded-lg border border-border p-3 space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground mb-1">前置条件检查</div>
                {[
                  { label: '逾期天数 ≥ 90天', pass: selectedItem.agingDays >= 90 },
                  { label: '已发送过催款函', pass: true },
                  { label: '证据链材料齐全', pass: completionPct === 100 },
                ].map((cond, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {cond.pass ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    )}
                    <span className={cond.pass ? 'text-foreground' : 'text-warning'}>{cond.label}</span>
                    <Badge variant={cond.pass ? 'success' : 'warning'} className="text-[9px] ml-auto">
                      {cond.pass ? '通过' : '未满足'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={() => setShowLitigationModal(false)}>取消</Button>
              <Button variant="destructive" onClick={handleInitiateLitigation}>
                <Scale className="h-3.5 w-3.5 mr-1.5" />
                确认发起诉讼
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 手动添加往年逾期数据弹窗 */}
      {showManualAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowManualAddModal(false)} />
          <div className="relative w-[560px] max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-card shadow-xl animate-scale-in">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border px-6 py-4 bg-card rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Plus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">添加往年逾期数据</h3>
                  <p className="text-xs text-muted-foreground">手动录入历史逾期信息，纳入统一管理</p>
                </div>
              </div>
              <button onClick={() => setShowManualAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="px-6 py-5 space-y-4">
              {/* 提示 */}
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200/60 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:border-amber-800/30 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>往年数据将标记为"手动录入"，在列表中与系统同步数据区隔展示，并在分析面板中单独统计。</span>
              </div>

              {/* 合同信息 */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-foreground">合同信息</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">合同编号 <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      placeholder="如 HT-2023-0088"
                      value={manualForm.contractNo}
                      onChange={e => setManualForm(f => ({ ...f, contractNo: e.target.value }))}
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">逾期年度 <span className="text-destructive">*</span></label>
                    <select
                      value={manualForm.year}
                      onChange={e => setManualForm(f => ({ ...f, year: e.target.value }))}
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="2020">2020年</option>
                      <option value="2021">2021年</option>
                      <option value="2022">2022年</option>
                      <option value="2023">2023年</option>
                      <option value="2024">2024年</option>
                      <option value="2025">2025年</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 客户信息 */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-foreground">客户信息</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">客户全称 <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      placeholder="全称"
                      value={manualForm.customerName}
                      onChange={e => setManualForm(f => ({ ...f, customerName: e.target.value }))}
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">客户简称</label>
                    <input
                      type="text"
                      placeholder="简称（可不填，取全称前4字）"
                      value={manualForm.customerShort}
                      onChange={e => setManualForm(f => ({ ...f, customerShort: e.target.value }))}
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* 金额信息 */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-foreground">金额信息</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">合同总金额</label>
                    <input
                      type="number"
                      placeholder="元"
                      value={manualForm.totalAmount}
                      onChange={e => setManualForm(f => ({ ...f, totalAmount: e.target.value }))}
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">剩余欠款金额 <span className="text-destructive">*</span></label>
                    <input
                      type="number"
                      placeholder="元"
                      value={manualForm.remainingAmount}
                      onChange={e => setManualForm(f => ({ ...f, remainingAmount: e.target.value }))}
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* 时间与负责人 */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-foreground">时间与责任人</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">约定付款日</label>
                    <input
                      type="date"
                      value={manualForm.dueDate}
                      onChange={e => setManualForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">负责人</label>
                    <input
                      type="text"
                      placeholder="销售/运营负责人"
                      value={manualForm.salesperson}
                      onChange={e => setManualForm(f => ({ ...f, salesperson: e.target.value }))}
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">所属部门</label>
                    <select
                      value={manualForm.department}
                      onChange={e => setManualForm(f => ({ ...f, department: e.target.value }))}
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="华东事业部">华东事业部</option>
                      <option value="华南事业部">华南事业部</option>
                      <option value="华北事业部">华北事业部</option>
                      <option value="西南事业部">西南事业部</option>
                      <option value="总部">总部</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 备注 */}
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">备注说明</label>
                <textarea
                  placeholder="补充说明逾期原因、历史催收情况等..."
                  rows={3}
                  value={manualForm.notes}
                  onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-card rounded-b-xl">
              <Button variant="outline" onClick={() => setShowManualAddModal(false)}>取消</Button>
              <Button onClick={handleManualAdd} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                确认添加
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
