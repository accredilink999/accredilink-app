import { cn } from "@/lib/utils";

export default function PageHeader({ title, subtitle, children, className, icon: Icon }) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", className)}>
      <div>
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8" />}
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        </div>
        {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-3 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}