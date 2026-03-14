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
    <div className="surface-card surface-card-hover p-4 space-y-3 relative overflow-hidden">
      {/* Subtle glow effect */}
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 bg-primary blur-2xl" />
      
      <div className="flex items-center justify-between relative">
        <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="text-xl font-bold text-foreground font-mono-data">{value}</div>
      <div className="flex items-center gap-2 text-[12px]">
        {(isPositive || isNegative) && (
          <span
            className={cn(
              "flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded",
              isNegative ? "text-cost-negative bg-cost-negative/10" : "text-cost-positive bg-cost-positive/10"
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
