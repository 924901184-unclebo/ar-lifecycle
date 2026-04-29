export type PoolLevel = 'total' | 'receivable' | 'overdue' | 'litigation' | 'baddebt'

export type UserRole = 'salesperson' | 'ops_manager' | 'finance' | 'legal' | 'admin'

export interface PoolMeta {
  dataSource: string
  syncMethod: string
  calcRule: string
  entryCondition: string
  exitCondition: string
  updateFrequency: string
  lastUpdated: string
}

export interface PoolConfig {
  level: number
  key: PoolLevel
  label: string
  description: string
  icon: string
  meta: PoolMeta
}

export interface ReceivableItem {
  id: string
  contractNo: string
  customerName: string
  customerShort: string
  totalAmount: number
  receivedAmount: number
  remainingAmount: number
  invoicedAmount: number
  poolLevel: PoolLevel
  dueDate: string
  agingDays: number
  agingBucket: string
  salesperson: string
  department: string
  contractDate: string
  lastAction: string
  lastActionDate: string
  evidenceCount: number
  hasCollectionRecord: boolean
  hasLawyerLetter: boolean
  status: string
  priority: 'high' | 'medium' | 'low'
  notes: string
}

export interface EvidenceItem {
  id: string
  receivableId: string
  type: 'contract' | 'invoice' | 'delivery' | 'collection' | 'lawyer_letter' | 'court_doc' | 'communication' | 'other'
  typeLabel: string
  fileName: string
  uploadedBy: string
  uploadedAt: string
  fileSize: string
  verified: boolean
}

export interface AuditLog {
  id: string
  receivableId: string
  action: string
  operator: string
  role: UserRole
  timestamp: string
  detail: string
  ip: string
}

export interface CollectionRecord {
  id: string
  receivableId: string
  method: 'phone' | 'visit' | 'letter' | 'email' | 'wechat'
  methodLabel: string
  date: string
  operator: string
  result: string
  nextFollowUp: string
  notes: string
}

export interface DashboardStats {
  totalDebt: number
  totalReceivable: number
  overdueAmount: number
  litigationAmount: number
  badDebtAmount: number
  collectionRate: number
  overdueRate: number
  avgAgingDays: number
  monthlyCollection: number
  poolCounts: Record<PoolLevel, number>
  poolAmounts: Record<PoolLevel, number>
}
