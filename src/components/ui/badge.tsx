import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
    | 'pool-total' | 'pool-receivable' | 'pool-overdue' | 'pool-litigation' | 'pool-baddebt'
}

const variantClasses: Record<string, string> = {
  default: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary text-secondary-foreground border-secondary",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  outline: "bg-transparent text-foreground border-border",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  "pool-total": "bg-pool-total-muted text-pool-total border-pool-total/20",
  "pool-receivable": "bg-pool-receivable-muted text-pool-receivable border-pool-receivable/20",
  "pool-overdue": "bg-pool-overdue-muted text-pool-overdue border-pool-overdue/20",
  "pool-litigation": "bg-pool-litigation-muted text-pool-litigation border-pool-litigation/20",
  "pool-baddebt": "bg-pool-baddebt-muted text-pool-baddebt border-pool-baddebt/20",
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
)
Badge.displayName = "Badge"

export { Badge }
