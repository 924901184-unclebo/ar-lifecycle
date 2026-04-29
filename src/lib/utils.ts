import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString('zh-CN')
}

export function calcAgingDays(dueDate: string): number {
  const now = new Date()
  const due = new Date(dueDate)
  const diff = now.getTime() - due.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getAgingBucket(days: number): string {
  if (days <= 0) return '未到期'
  if (days <= 30) return '1-30天'
  if (days <= 60) return '31-60天'
  if (days <= 90) return '61-90天'
  if (days <= 180) return '91-180天'
  return '180天以上'
}
