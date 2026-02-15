import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, trendDirection, className, iconClassName }) {
  return (
    <Card className={cn("p-5 bg-purple-100 border-0 shadow-sm hover:shadow-md transition-all duration-300", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              trendDirection === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            )}>
              {trend}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-3 rounded-xl bg-teal-50",
            iconClassName
          )}>
            <Icon className="w-5 h-5 text-teal-600" />
          </div>
        )}
      </div>
    </Card>
  );
}