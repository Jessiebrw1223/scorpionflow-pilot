import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  subValue: string;
  icon: LucideIcon;
  trend: number;
  trendLabel: string;
}

export function KpiCard({ label, value, subValue, icon: Icon, trend, trendLabel }: KpiCardProps) {
  const isNegative = trend < 0;
  const isPositive = trend > 0;

  return (
    <div className="surface-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="text-lg font-semibold text-foreground font-mono-data">{value}</div>
      <div className="flex items-center gap-2 text-[12px]">
        {(isPositive || isNegative) && (
          <span
            className={cn(
              "flex items-center gap-0.5 font-medium",
              isNegative ? "text-cost-negative" : "text-cost-positive"
            )}
          >
            {isNegative ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <TrendingUp className="w-3 h-3" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        <span className="text-muted-foreground">{subValue}</span>
      </div>
    </div>
  );
}
