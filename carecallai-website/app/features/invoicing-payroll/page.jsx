import { Receipt, Building2, CreditCard, FileSpreadsheet, ArrowRightLeft, PoundSterling, Calculator } from "lucide-react";
import FeaturePageLayout from "@/components/FeaturePageLayout";

export const metadata = {
  title: "Invoicing, Payroll & Accounting Integration",
  description:
    "Care agency invoicing for councils and private clients. Payroll from logged shifts. Connects to QuickBooks, Sage and Xero. Automatic mileage expenses.",
  keywords: ["care agency invoicing", "care payroll software", "home care billing software", "council care invoicing", "quickbooks care software", "sage care integration", "xero care software"],
  alternates: { canonical: "https://www.carecallai.co.uk/features/invoicing-payroll" },
  openGraph: {
    title: "Invoicing & Payroll — CareCallAI",
    description: "Council and private invoicing, payroll from logged shifts, QuickBooks/Sage/Xero integration and automatic mileage.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invoicing & Payroll — CareCallAI",
    description: "Council and private invoicing, payroll from logged shifts, QuickBooks/Sage/Xero integration and automatic mileage.",
  },
};

export default function InvoicingPayrollPage() {
  return (
    <FeaturePageLayout
      icon={Receipt}
      title="Invoicing, Payroll & Accounting"
      subtitle="Bill councils and private clients, pay staff and sync with your accounting software — all from one place"
      description="CareCallAI generates invoices directly from logged care visits. Bill local councils in their required format, invoice private clients automatically, and calculate staff payroll from shift hours. Connect to QuickBooks, Sage or Xero so your accounts are always up to date."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "Invoicing & Payroll" },
      ]}
      benefits={[
        { title: "Council Invoicing", description: "Generate invoices in the format required by local councils and health boards. Upload to council portals or email directly. Track purchase order numbers, framework rates and contract hours." },
        { title: "Private Client Billing", description: "Bill self-funding clients automatically based on logged visits. Set individual rates, generate branded PDF invoices and send by email with one click." },
        { title: "Payroll from Logged Shifts", description: "Calculate staff pay from actual worked shifts, including overtime, bank holiday enhancements, sleep-in rates and mileage allowances. No manual timesheets needed." },
        { title: "QuickBooks Integration", description: "Sync invoices, payments and expenses directly to QuickBooks Online. Client records, invoice lines and payment status stay in sync automatically." },
        { title: "Sage Integration", description: "Export invoices and payroll data in Sage-compatible format. Push data directly to Sage 50 or Sage Business Cloud with one click." },
        { title: "Xero Integration", description: "Connect to Xero to sync invoices, bills and bank reconciliation data. Approved expenses and mileage claims flow through automatically." },
        { title: "Mileage & Expense Claims", description: "Staff mileage is logged automatically from GPS check-in locations. Parking, equipment and other expenses are submitted via the app and approved by managers." },
        { title: "Custom Rate Cards", description: "Set different hourly rates per client, per call type (weekday, weekend, bank holiday, night, sleep-in) and per staff member. Apply council framework rates automatically." },
      ]}
      howItWorks={[
        { title: "Set up rate cards and client billing type", description: "Configure each client as council-funded or private. Set hourly rates, contract hours, purchase order numbers and invoice frequency (weekly, fortnightly or monthly)." },
        { title: "Visits are logged automatically", description: "As carers complete visits via the app, GPS-verified check-in/check-out times and durations are recorded. Mileage between calls is calculated automatically." },
        { title: "Generate and send invoices", description: "At the end of each billing period, generate council invoices (grouped by purchase order) and private client invoices. Review, approve, then send by email or export as PDF." },
        { title: "Sync to your accounting software", description: "Approved invoices and payroll data sync to QuickBooks, Sage or Xero automatically. Payments are reconciled and your books stay up to date without manual entry." },
      ]}
      faqs={[
        { question: "Can I invoice councils directly?", answer: "Yes. CareCallAI generates invoices in the format councils require, grouped by purchase order number and framework rate. You can export as PDF, CSV or email directly from the system." },
        { question: "How does the QuickBooks integration work?", answer: "Once connected, CareCallAI syncs client records, invoices, payments and expenses to QuickBooks Online automatically. You can also manually push individual invoices when needed." },
        { question: "Do you support Sage 50 (desktop)?", answer: "Yes. For Sage 50 desktop, we export in Sage-compatible CSV format for import. For Sage Business Cloud, we offer direct API integration." },
        { question: "Can I set different rates for different clients?", answer: "Yes. Each client can have custom hourly rates for different call types and time periods (weekday, weekend, night, bank holiday, sleep-in). Council-funded clients use framework rates." },
        { question: "Does it calculate overtime and enhancements?", answer: "Yes. Configure overtime rules, bank holiday multipliers, weekend enhancements and sleep-in rates. CareCallAI calculates everything automatically from logged shift data." },
        { question: "How does mileage feed into expenses?", answer: "Mileage is calculated automatically from GPS check-in locations between consecutive calls. Staff see their accumulated mileage in the app and managers approve claims at the end of each week. Approved mileage syncs to your accounting software." },
        { question: "Can I split invoices between council and top-up private funding?", answer: "Yes. For clients with mixed funding, you can set a council-funded allocation and a private top-up amount. Both invoices are generated from the same logged visits." },
      ]}
      relatedFeatures={[
        { name: "Scheduling & Rota", href: "/features/scheduling" },
        { name: "Staff Management", href: "/features/staff-management" },
        { name: "Care Logging", href: "/features/care-logging" },
        { name: "GPS Check-In & Tracking", href: "/features/gps-tracking" },
      ]}
    />
  );
}
