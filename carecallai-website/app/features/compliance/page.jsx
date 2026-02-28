import { ShieldCheck } from "lucide-react";
import FeaturePageLayout from "@/components/FeaturePageLayout";

export const metadata = {
  title: "Compliance, Auditing & Virtual Care Inspector",
  description:
    "CIW and CQC compliant care software with built-in Virtual Care Inspector. 50+ automated compliance checks, real-time scoring, gap detection and inspection-ready reports.",
  keywords: ["CIW compliant care software", "CQC compliant care software", "care compliance software UK", "care audit trail software", "virtual care inspection", "care home compliance checker"],
};

export default function CompliancePage() {
  return (
    <FeaturePageLayout
      icon={ShieldCheck}
      title="Compliance, Auditing & Virtual Care Inspector"
      subtitle="Built from the ground up for CIW and CQC compliance — with an automated inspection engine that checks your records before a real inspector does"
      description="Every action in CareCallAI is logged, timestamped and immutable. The Virtual Care Inspector runs 50+ automated checks across 8 categories — staff DBS, supervisions, training, care plans, MAR charts, incidents and governance — giving you a live compliance score and flagging issues before they become inspection failures."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "Compliance & Virtual Inspector" },
      ]}
      benefits={[
        { title: "Virtual Care Inspector", description: "One-click automated inspection: runs 50+ checks across staff compliance, supervisions, training, service users, medication, care delivery, incidents and governance. Returns a scored report with CIW/CQC rating and actionable findings." },
        { title: "Live compliance scoring", description: "See your inspection readiness as a percentage score per category. The system rates you as Excellent/Good/Adequate/Poor (CIW) or Outstanding/Good/Requires Improvement/Inadequate (CQC) — so you always know where you stand." },
        { title: "Gap detection", description: "Automatically flags missing DBS checks, expired training certificates, overdue supervisions, care plans without review dates, MAR chart gaps, unresolved incidents and unfiled governance reports." },
        { title: "Automatic audit trails", description: "Every care log, medication record and incident report is automatically timestamped with the user who created it. Records are immutable with full version history." },
        { title: "Incident reporting", description: "Staff report incidents immediately from the mobile app. Managers are notified in real time and can assign follow-up actions." },
        { title: "Regulation-mapped findings", description: "Every finding from the Virtual Inspector is mapped to its specific regulation (CIW RISCA Reg 29, CQC HSCA Reg 19, etc.) with severity level (Critical, High, Medium, Warning) so you know exactly what to fix and why it matters." },
      ]}
      howItWorks={[
        { title: "Records build automatically", description: "As your team uses CareCallAI for scheduling, care logging and medications, compliance records are created automatically. No extra work." },
        { title: "Run the Virtual Inspector", description: "Click one button in the Compliance area to run a full inspection. The system checks all staff records, supervision cycles, training certificates, service user care plans, MAR charts, incident reports and governance filings against CIW/CQC requirements." },
        { title: "Review findings and fix gaps", description: "The inspection report shows every finding grouped by category with severity levels. Expand any category to see exactly which staff member, service user or record has the issue — then fix it directly in the app." },
        { title: "Achieve inspection readiness", description: "Run the inspector regularly to track improvement. When a real CIW or CQC inspector arrives, you can demonstrate live compliance scores and a clean audit trail with confidence." },
      ]}
      faqs={[
        { question: "What does the Virtual Care Inspector check?", answer: "It runs 50+ automated checks across 8 categories: Staff Compliance (DBS, right to work, contracts), Supervision (12-weekly cycles), Training (certificates, expiry dates, induction), Service Users (care plans, reviews, assessments, contacts), Medication (MAR gaps, administration records), Care Delivery (shift coverage, care logs), Incidents (reporting, follow-up, resolution) and Governance (RI visits, quality reviews, audits)." },
        { question: "Is CareCallAI CIW compliant?", answer: "Yes. CareCallAI meets all CIW requirements for domiciliary care under RISCA 2016, including care logs, medication records, incident reports, staff supervision tracking and the Virtual Inspector which checks against specific CIW regulations (Reg 21-80)." },
        { question: "Is CareCallAI CQC compliant?", answer: "Yes. CareCallAI meets CQC requirements under the Health and Social Care Act 2008, covering all five key questions (Safe, Effective, Caring, Responsive, Well-led). The Virtual Inspector checks against CQC Regulations 9-20." },
        { question: "How is the compliance score calculated?", answer: "Each category is scored based on the number and severity of findings. Critical issues carry the heaviest deduction. Categories are weighted (Staff Compliance 20%, Service Users 20%, etc.) to produce an overall percentage. Any critical finding caps the maximum rating at Adequate/Requires Improvement." },
        { question: "Are records immutable?", answer: "Yes. Original entries cannot be deleted or modified. Amendments are logged separately with timestamps, preserving the complete audit trail that inspectors require." },
      ]}
      relatedFeatures={[
        { name: "Care Logging", href: "/features/care-logging" },
        { name: "Medication / MAR Charts", href: "/features/medication-management" },
        { name: "Staff Management", href: "/features/staff-management" },
      ]}
    />
  );
}
