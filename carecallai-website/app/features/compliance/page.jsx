import { ShieldCheck } from "lucide-react";
import FeaturePageLayout from "@/components/FeaturePageLayout";

export const metadata = {
  title: "Compliance & Auditing",
  description:
    "CIW and CQC compliant care software. Incident reporting, risk assessments, care plans, audit trails and inspection-ready reports.",
  keywords: ["CIW compliant care software", "CQC compliant care software", "care compliance software UK", "care audit trail software"],
};

export default function CompliancePage() {
  return (
    <FeaturePageLayout
      icon={ShieldCheck}
      title="Compliance & Auditing"
      subtitle="Built from the ground up for CIW and CQC compliance"
      description="Every action in CareCallAI is logged, timestamped and immutable. Incident reports, risk assessments, care plans and medication records are always inspection-ready."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "Compliance & Auditing" },
      ]}
      benefits={[
        { title: "Automatic audit trails", description: "Every care log, medication record and incident report is automatically timestamped with the user who created it." },
        { title: "Incident reporting", description: "Staff report incidents immediately from the mobile app. Managers are notified in real time and can assign follow-up actions." },
        { title: "Risk assessments", description: "Create and manage risk assessments for each client with file attachments, review dates and sign-off tracking." },
        { title: "Care plans", description: "Digital care plans with expandable text fields, document attachments and version history." },
        { title: "Inspection-ready reports", description: "Generate compliance reports covering care logs, medications, incidents and training — formatted for CIW and CQC inspectors." },
        { title: "Document storage", description: "Upload and organise policies, procedures and certificates. Track expiry dates and distribute to staff." },
      ]}
      howItWorks={[
        { title: "Records build automatically", description: "As your team uses CareCallAI for scheduling, care logging and medications, compliance records are created automatically. No extra work." },
        { title: "Monitor in real time", description: "The compliance dashboard shows gaps — missing training, overdue reviews, incomplete care logs — so you can fix issues before an inspection." },
        { title: "Generate reports", description: "When an inspector arrives, pull up any client's full history — care logs, MAR charts, incidents, risk assessments — in seconds." },
      ]}
      faqs={[
        { question: "Is CareCallAI CIW compliant?", answer: "Yes. CareCallAI meets all CIW requirements for domiciliary care record-keeping in Wales, including care logs, medication records, incident reports and staff training records." },
        { question: "Is CareCallAI CQC compliant?", answer: "Yes. CareCallAI meets CQC requirements for record-keeping in England, covering all five key lines of enquiry (Safe, Effective, Caring, Responsive, Well-led)." },
        { question: "Can I generate reports for inspections?", answer: "Yes. You can generate comprehensive reports per client, per carer or across the whole agency, filtered by date range." },
        { question: "Are records immutable?", answer: "Yes. Original entries cannot be deleted or modified. Amendments are logged separately with timestamps, preserving the complete audit trail." },
      ]}
      relatedFeatures={[
        { name: "Care Logging", href: "/features/care-logging" },
        { name: "Medication / MAR Charts", href: "/features/medication-management" },
        { name: "Staff Management", href: "/features/staff-management" },
      ]}
    />
  );
}
