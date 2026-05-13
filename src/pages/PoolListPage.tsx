import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, Filter, Download, ArrowUpDown, FileText, ChevronRight, Info, Database, Calculator, Clock, ArrowRightLeft, RefreshCw, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatNumber } from '@/lib/utils'
import { receivables, poolConfigs } from '@/data/mockData'
import { useApp } from '@/hooks/useApp'
import { showToast } from '@/components/ui/toast'
import { DetailPanel } from '@/components/detail/DetailPanel'
import type { PoolLevel, ReceivableItem } from '@/types'

const poolBadgeVariant: Record<PoolLevel, 'pool-total' | 'pool-receivable' | 'pool-overdue' | 'pool-litigation' | 'pool-baddebt'> = {
  total: 'pool-total',
  receivable: 'pool-receivable',
  overdue: 'pool-overdue',
  litigation: 'pool-litigation',
  baddebt: 'pool-baddebt',
}

interface PoolListPageProps {
  poolLevel: PoolLevel
}

export function PoolListPage({ poolLevel }: PoolListPageProps) {
  const { selectedItemId, setSelectedItemId } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof ReceivableItem>('remainingAmount')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showPoolMeta, setShowPoolMeta] = useState(false)
  const metaRef = useRef<HTMLDivElement>(null)

  /* Close meta popover on outside click */
  useEffect(() => {
    if (!showPoolMeta) return
    const handler = (e: MouseEvent) => {
      if (metaRef.current && !metaRef.current.contains(e.target as Node)) {
        setShowPoolMeta(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPoolMeta])

  const config = poolConfigs.find(p => p.key === poolLevel)!

  const filtered = useMemo(() => {
    let items = receivables.filter(r => r.poolLevel === poolLevel)
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter(r =>
        r.contractNo.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerShort.toLowerCase().includes(q)
      )
    }
    items.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
    return items
  }, [poolLevel, searchTerm, sortField, sortDir])

  const totalAmount = filtered.reduce((sum, r) => sum + r.remainingAmount, 0)

  const toggleSort = (field: keyof ReceivableItem) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(r => r.id)))
    }
  }

  const handleBatchAction = (action: string) => {
    if (selectedIds.size === 0) {
      showToast('请先选择记录', 'warning')
      return
    }
    showToast(`已对 ${selectedIds.size} 条记录执行"${action}"操作`, 'success')
    setSelectedIds(new Set())
  }

  const selectedItem = selectedItemId ? receivables.find(r => r.id === selectedItemId) : null

  return (
    <div className="flex gap-4 animate-fade-in min-w-0">
      {/* Main List */}
      <div className={cn("flex-1 min-w-0 space-y-4 transition-all duration-300", selectedItem && "lg:max-w-[calc(100%-420px)]")}>
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={poolBadgeVariant[poolLevel]} className="text-xs">
                Level {config.level}
              </Badge>
              <h1 className="text-2xl font-bold text-foreground">{config.label}</h1>

              {/* Pool Meta Info Button */}
              <div className="relative" ref={metaRef}>
                <button
                  onClick={() => setShowPoolMeta(v => !v)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200",
                    showPoolMeta
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground"
                  )}
                  title="查看状态池说明"
                >
                  <Info className="h-4 w-4" />
                </button>

                {/* Pool Meta Popover */}
                {showPoolMeta && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-[420px] rounded-xl border border-border bg-card shadow-lg animate-scale-in">
                    {/* Popover header */}
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md",
                          poolLevel === 'total' ? 'bg-pool-total/10' :
                          poolLevel === 'receivable' ? 'bg-pool-receivable/10' :
                          poolLevel === 'overdue' ? 'bg-pool-overdue/10' :
                          poolLevel === 'litigation' ? 'bg-pool-litigation/10' :
                          'bg-pool-baddebt/10'
                        )}>
                          <Info className={cn(
                            "h-3.5 w-3.5",
                            poolLevel === 'total' ? 'text-pool-total' :
                            poolLevel === 'receivable' ? 'text-pool-receivable' :
                            poolLevel === 'overdue' ? 'text-pool-overdue' :
                            poolLevel === 'litigation' ? 'text-pool-litigation' :
                            'text-pool-baddebt'
                          )} />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{config.label} · 数据说明</span>
                      </div>
                      <button
                        onClick={() => setShowPoolMeta(false)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Popover body */}
                    <div className="p-4 space-y-3">
                      {[
                        { icon: Database, label: '数据来源', value: config.meta.dataSource },
                        { icon: RefreshCw, label: '同步机制', value: config.meta.syncMethod },
                        { icon: Calculator, label: '计算规则', value: config.meta.calcRule },
                        { icon: ArrowRightLeft, label: '进入条件', value: config.meta.entryCondition },
                        { icon: ArrowRightLeft, label: '流出条件', value: config.meta.exitCondition },
                        { icon: Clock, label: '更新频率', value: config.meta.updateFrequency },
                      ].map((row) => {
                        const RowIcon = row.icon
                        return (
                          <div key={row.label} className="flex gap-3">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground mt-0.5">
                              <RowIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-medium text-muted-foreground">{row.label}</div>
                              <div className="text-sm text-foreground leading-relaxed">{row.value}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Popover footer */}
                    <div className="flex items-center justify-between border-t border-border px-4 py-2.5 bg-muted/30 rounded-b-xl">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>最近更新：{config.meta.lastUpdated}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">L{config.level} 状态池</Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{filtered.length} 笔 | 合计</span>
            <span className="text-lg font-bold tabular-nums text-foreground">¥{formatNumber(totalAmount)}</span>
          </div>
        </div>

        {/* Toolbar */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索合同号、客户名称..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-8 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                筛选
              </Button>
              <Button variant="outline" size="sm" onClick={() => showToast('导出功能已触发', 'info')}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                导出
              </Button>

              {/* Batch actions for overdue pool */}
              {poolLevel === 'overdue' && selectedIds.size > 0 && (
                <div className="flex items-center gap-2 ml-auto border-l border-border pl-3">
                  <span className="text-xs text-muted-foreground">已选 {selectedIds.size} 项</span>
                  <Button size="sm" variant="warning" onClick={() => handleBatchAction('批量发送催款函')}>
                    批量发函
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleBatchAction('转入诉讼池')}>
                    转诉讼
                  </Button>
                </div>
              )}

              {poolLevel === 'litigation' && selectedIds.size > 0 && (
                <div className="flex items-center gap-2 ml-auto border-l border-border pl-3">
                  <span className="text-xs text-muted-foreground">已选 {selectedIds.size} 项</span>
                  <Button size="sm" onClick={() => handleBatchAction('生成诉讼包')}>
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    生成诉讼包
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="data-table min-w-[800px]">
              <thead>
                <tr>
                  {(poolLevel === 'overdue' || poolLevel === 'litigation') && (
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                  )}
                  <th>合同编号</th>
                  <th>客户名称</th>
                  <th className="cursor-pointer" onClick={() => toggleSort('remainingAmount')}>
                    <div className="flex items-center gap-1">
                      待收金额
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  {poolLevel !== 'total' && <th>已开票</th>}
                  {(poolLevel === 'overdue' || poolLevel === 'litigation' || poolLevel === 'baddebt') && (
                    <th className="cursor-pointer" onClick={() => toggleSort('agingDays')}>
                      <div className="flex items-center gap-1">
                        逾期天数
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}
                  <th>负责人</th>
                  <th>状态</th>
                  <th>证据</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-muted-foreground">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  filtered.map(item => (
                    <tr
                      key={item.id}
                      className={cn(
                        "cursor-pointer",
                        item.agingDays > 90 && item.poolLevel === 'overdue' && "row-overdue",
                        selectedItemId === item.id && "bg-primary/5"
                      )}
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      {(poolLevel === 'overdue' || poolLevel === 'litigation') && (
                        <td onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="rounded border-border"
                          />
                        </td>
                      )}
                      <td className="font-mono text-xs">{item.contractNo}</td>
                      <td>
                        <div>
                          <div className="font-medium">{item.customerShort}</div>
                          <div className="text-[11px] text-muted-foreground">{item.department}</div>
                        </div>
                      </td>
                      <td className="font-semibold tabular-nums">¥{formatNumber(item.remainingAmount)}</td>
                      {poolLevel !== 'total' && (
                        <td className="tabular-nums text-muted-foreground">¥{formatNumber(item.invoicedAmount)}</td>
                      )}
                      {(poolLevel === 'overdue' || poolLevel === 'litigation' || poolLevel === 'baddebt') && (
                        <td>
                          <Badge variant={
                            item.agingDays > 180 ? 'pool-litigation' :
                            item.agingDays > 90 ? 'pool-overdue' :
                            item.agingDays > 30 ? 'warning' : 'default'
                          }>
                            {item.agingDays}天
                          </Badge>
                        </td>
                      )}
                      <td className="text-muted-foreground">{item.salesperson}</td>
                      <td>
                        <Badge variant={poolBadgeVariant[item.poolLevel]}>
                          {item.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="text-xs">{item.evidenceCount}</span>
                        </div>
                      </td>
                      <td>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <DetailPanel item={selectedItem} onClose={() => setSelectedItemId(null)} />
      )}
    </div>
  )
}
