import { Users } from "lucide-react";
import FeaturePageLayout from "@/components/FeaturePageLayout";

export const metadata = {
  title: "Staff Management",
  description:
    "Staff management software for care agencies. Leave requests, training tracking, DBS alerts, expenses, emergency contacts and editable profiles.",
  keywords: ["care staff management", "care worker HR software", "domiciliary care staff software"],
  alternates: { canonical: "https://carecallai.co.uk/features/staff-management" },
  openGraph: {
    title: "Staff Management — CareCallAI",
    description: "Leave requests, training tracking, DBS alerts, expenses and profiles. Complete HR for care agencies.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Staff Management — CareCallAI",
    description: "Leave requests, training tracking, DBS alerts, expenses and profiles. Complete HR for care agencies.",
  },
};

export default function StaffManagementPage() {
  return (
    <FeaturePageLayout
      icon={Users}
      title="Staff Management"
      subtitle="Everything you need to manage your care workforce"
      description="Leave requests with approval workflows, training tracking with expiry alerts, DBS monitoring, expenses, emergency contacts — all in one staff profile."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "Staff Management" },
      ]}
      benefits={[
        { title: "Editable staff profiles", description: "Admins can edit staff name, phone, email, address and emergency contacts directly from the profile page." },
        { title: "Leave management", description: "Staff submit leave requests, managers approve or decline, and the rota automatically reflects approved leave." },
        { title: "Training tracking", description: "Record mandatory training (manual handling, safeguarding, first aid) with completion dates and auto-alerts when renewals are due." },
        { title: "DBS monitoring", description: "Track DBS check dates and get alerts before they expire. Essential for compliance." },
        { title: "Expenses", description: "Staff submit mileage and expenses. Managers approve, and totals feed into payroll calculations." },
        { title: "Emergency contacts", description: "Store next-of-kin details for every staff member, accessible to managers at any time." },
      ]}
      howItWorks={[
        { title: "Add your staff", description: "Create profiles for each team member with their contact details, role, area assignment and start date." },
        { title: "Set up training requirements", description: "Configure which training modules are required and their renewal intervals. CareCallAI tracks completion and sends alerts." },
        { title: "Manage day-to-day", description: "Staff request leave, submit expenses and update their availability. Managers approve and the rota updates automatically." },
      ]}
      faqs={[
        { question: "Can staff update their own profiles?", answer: "Staff can view their profile and submit update requests. Admins verify and apply changes to maintain data accuracy." },
        { question: "How do training alerts work?", answer: "CareCallAI sends notifications to both staff and managers when training is due to expire — 30 days, 7 days and on the expiry date." },
        { question: "Can I track DBS checks?", answer: "Yes. Enter the DBS check date and CareCallAI monitors it automatically, alerting you before it expires." },
      ]}
      relatedFeatures={[
        { name: "Scheduling & Rota", href: "/features/scheduling" },
        { name: "Invoicing & Payroll", href: "/features/invoicing-payroll" },
        { name: "Compliance & Auditing", href: "/features/compliance" },
        { name: "Free Staff Training", href: "/training" },
      ]}
    />
  );
}
