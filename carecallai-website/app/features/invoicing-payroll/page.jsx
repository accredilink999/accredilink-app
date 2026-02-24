import { Receipt } from "lucide-react";
import FeaturePageLayout from "@/components/FeaturePageLayout";

export const metadata = {
  title: "Invoicing & Payroll",
  description:
    "Care agency invoicing and payroll software. Generate invoices from logged visits, calculate payroll from shifts, manage expenses and track payments.",
  keywords: ["care agency invoicing", "care payroll software", "home care billing software"],
};

export default function InvoicingPayrollPage() {
  return (
    <FeaturePageLayout
      icon={Receipt}
      title="Invoicing & Payroll"
      subtitle="Turn logged visits into invoices and payslips automatically"
      description="CareCallAI calculates client invoices from care logs and staff payroll from shift hours. No more manual spreadsheets — everything flows from the rota."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "Invoicing & Payroll" },
      ]}
      benefits={[
        { title: "Auto-generated invoices", description: "Generate client invoices based on actual logged visits, durations and hourly rates. No manual entry." },
        { title: "Payroll calculations", description: "Calculate staff pay from worked shifts, including overtime, bank holidays and mileage allowances." },
        { title: "Expense management", description: "Staff submit expenses (mileage, parking, equipment) which managers approve and include in payroll." },
        { title: "Payment tracking", description: "Mark invoices as sent, paid or overdue. Track outstanding balances by client." },
        { title: "Custom rates", description: "Set different hourly rates per client, per call type (weekday, weekend, bank holiday, night) and per staff member." },
        { title: "Export ready", description: "Export invoices as PDF and payroll data as CSV for your accountant or payroll provider." },
      ]}
      howItWorks={[
        { title: "Set up rates", description: "Configure hourly rates per client and per staff member. Set different rates for weekdays, weekends, nights and bank holidays." },
        { title: "Visits are logged automatically", description: "As carers complete visits through the app, the system records exact arrival/departure times and durations." },
        { title: "Generate invoices and payroll", description: "At the end of the period, generate client invoices and staff payroll from the logged data. Review, adjust if needed, and export." },
      ]}
      faqs={[
        { question: "Can I set different rates for different clients?", answer: "Yes. Each client can have custom hourly rates for different call types and time periods (weekday, weekend, night, bank holiday)." },
        { question: "Does it calculate overtime?", answer: "Yes. You can configure overtime rules and CareCallAI will automatically calculate overtime based on weekly hours worked." },
        { question: "Can I export for my accountant?", answer: "Yes. Payroll data exports as CSV and invoices export as PDF. You can also generate summary reports by date range." },
      ]}
      relatedFeatures={[
        { name: "Scheduling & Rota", href: "/features/scheduling" },
        { name: "Staff Management", href: "/features/staff-management" },
        { name: "Care Logging", href: "/features/care-logging" },
      ]}
    />
  );
}
