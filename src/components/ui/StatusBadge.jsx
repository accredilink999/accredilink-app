import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles = {
  // Shift statuses
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  no_show: "bg-red-50 text-red-700 border-red-200",
  
  // Leave statuses
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  
  // Training statuses
  valid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expiring_soon: "bg-amber-50 text-amber-700 border-amber-200",
  expired: "bg-red-50 text-red-700 border-red-200",
  not_started: "bg-slate-100 text-slate-600 border-slate-200",
  
  // Incident statuses
  open: "bg-red-50 text-red-700 border-red-200",
  investigating: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
  
  // Service user statuses
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  on_hold: "bg-amber-50 text-amber-700 border-amber-200",
  discharged: "bg-slate-100 text-slate-600 border-slate-200",
  
  // Severity
  low: "bg-blue-50 text-blue-700 border-blue-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
  
  // Medication
  given: "bg-emerald-50 text-emerald-700 border-emerald-200",
  refused: "bg-red-50 text-red-700 border-red-200",
  not_available: "bg-slate-100 text-slate-600 border-slate-200",
  hospital: "bg-blue-50 text-blue-700 border-blue-200",
  self_administered: "bg-purple-50 text-purple-700 border-purple-200",
  
  // Priority
  normal: "bg-slate-100 text-slate-600 border-slate-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

const statusLabels = {
  in_progress: "In Progress",
  no_show: "No Show",
  expiring_soon: "Expiring Soon",
  not_started: "Not Started",
  on_hold: "On Hold",
  not_available: "Not Available",
  self_administered: "Self Administered",
  annual_leave: "Annual Leave",
  sick_leave: "Sick Leave",
  unpaid_leave: "Unpaid Leave",
  maternity: "Maternity",
  paternity: "Paternity",
  compassionate: "Compassionate",
};

export default function StatusBadge({ status, className }) {
  const style = statusStyles[status] || "bg-slate-100 text-slate-600 border-slate-200";
  const label = statusLabels[status] || status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium border", style, className)}
    >
      {label}
    </Badge>
  );
}