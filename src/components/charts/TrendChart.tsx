import { formatNumber } from '@/lib/utils'

interface TrendDataItem {
  month: string
  receivable: number
  collection: number
  overdue: number
}

interface TrendChartProps {
  data: TrendDataItem[]
}

export function TrendChart({ data }: TrendChartProps) {
  const maxValue = Math.max(...data.flatMap(d => [d.receivable, d.collection, d.overdue]))
  const chartHeight = 200

  const getY = (value: number) => chartHeight - (value / maxValue) * (chartHeight - 20)

  /* Build SVG polyline points */
  const buildPoints = (key: keyof Omit<TrendDataItem, 'month'>) =>
    data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = getY(d[key])
      return `${x},${y}`
    }).join(' ')

  const lines = [
    { key: 'receivable' as const, label: '应收总额', color: 'hsl(235, 60%, 52%)', dashArray: '' },
    { key: 'overdue' as const, label: '逾期金额', color: 'hsl(25, 90%, 54%)', dashArray: '' },
    { key: 'collection' as const, label: '回款金额', color: 'hsl(145, 63%, 42%)', dashArray: '' },
  ]

  return (
    <div className="space-y-3">
      {/* SVG Chart */}
      <div className="relative w-full" style={{ height: chartHeight }}>
        <svg viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(pct => (
            <line
              key={pct}
              x1="0" y1={chartHeight - pct * (chartHeight - 20)}
              x2="100" y2={chartHeight - pct * (chartHeight - 20)}
              stroke="hsl(220, 13%, 91%)" strokeWidth="0.2" strokeDasharray="1,1"
            />
          ))}

          {/* Area fills */}
          {lines.map(line => (
            <polygon
              key={`area-${line.key}`}
              points={`0,${chartHeight} ${buildPoints(line.key)} 100,${chartHeight}`}
              fill={line.color}
              opacity="0.06"
            />
          ))}

          {/* Lines */}
          {lines.map(line => (
            <polyline
              key={line.key}
              points={buildPoints(line.key)}
              fill="none"
              stroke={line.color}
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={line.dashArray}
            />
          ))}

          {/* Dots */}
          {lines.map(line =>
            data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100
              const y = getY(d[line.key])
              return (
                <circle
                  key={`${line.key}-${i}`}
                  cx={x} cy={y} r="0.8"
                  fill={line.color}
                  stroke="white"
                  strokeWidth="0.3"
                />
              )
            })
          )}
        </svg>

        {/* X axis labels */}
        <div className="flex justify-between mt-1">
          {data.map(d => (
            <span key={d.month} className="text-[10px] text-muted-foreground">
              {d.month.split('-')[1]}月
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        {lines.map(line => {
          const latest = data[data.length - 1]
          return (
            <div key={line.key} className="flex items-center gap-1.5">
              <div className="h-2 w-4 rounded-full" style={{ backgroundColor: line.color }} />
              <span className="text-xs text-muted-foreground">{line.label}</span>
              <span className="text-xs font-medium tabular-nums">¥{formatNumber(latest[line.key])}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
