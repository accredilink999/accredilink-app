import { ClipboardList } from "lucide-react";
import FeaturePageLayout from "@/components/FeaturePageLayout";

export const metadata = {
  title: "Care Logging",
  description:
    "Digital care logging for home care agencies. Real-time care logs with timestamps, evidence, medication prompts and full audit trails. CIW & CQC compliant.",
  keywords: ["digital care logging", "home care logs", "care visit recording", "domiciliary care records"],
  alternates: { canonical: "https://www.carecallai.co.uk/features/care-logging" },
  openGraph: {
    title: "Digital Care Logging — CareCallAI",
    description: "Real-time care logs with timestamps, evidence and full audit trails. CIW & CQC compliant.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Care Logging — CareCallAI",
    description: "Real-time care logs with timestamps, evidence and full audit trails. CIW & CQC compliant.",
  },
};

export default function CareLoggingPage() {
  return (
    <FeaturePageLayout
      icon={ClipboardList}
      title="Care Logging"
      subtitle="Replace paper daily notes with real-time digital care records"
      description="Carers log every visit on their phone — what care was provided, medications given, mood observations and any concerns. Managers see everything in real time."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "Care Logging" },
      ]}
      benefits={[
        { title: "Real-time visibility", description: "Managers can see care logs as they're completed — no waiting for paperwork to come back to the office." },
        { title: "Timestamp accuracy", description: "Every log is automatically timestamped with the carer's arrival and departure times." },
        { title: "Medication prompts", description: "When logging a visit, carers are prompted to open the MAR chart if medications are due." },
        { title: "Communication logs", description: "Record communications with families, GPs and social workers alongside care records." },
        { title: "Evidence capture", description: "Attach photos, notes and observations to any care log entry." },
        { title: "Audit trail", description: "Every care log is immutable and timestamped — perfect for CIW and CQC inspections." },
      ]}
      howItWorks={[
        { title: "Carer arrives at visit", description: "Open the CareCallAI app, select the client and start the care log. The clock starts automatically." },
        { title: "Log the care provided", description: "Record tasks completed, medications given (via MAR chart popup), mood, food/fluid intake and any concerns." },
        { title: "Submit and move on", description: "Complete the log, which is instantly visible to managers. The next visit on the rota is ready and waiting." },
      ]}
      faqs={[
        { question: "Can carers log offline?", answer: "The mobile app allows offline logging. Logs are synced to the server as soon as the device reconnects." },
        { question: "Can managers review and amend logs?", answer: "Managers can view all care logs and add notes. Original entries cannot be deleted — any amendments are logged separately for audit purposes." },
        { question: "Does it integrate with the MAR chart?", answer: "Yes. During care logging, carers can open the MAR chart as a popup, record medications, then return to the care log with a 'Done' button." },
      ]}
      relatedFeatures={[
        { name: "Medication / MAR Charts", href: "/features/medication-management" },
        { name: "Compliance & Auditing", href: "/features/compliance" },
        { name: "Mobile App", href: "/features/mobile-app" },
        { name: "Free Staff Training", href: "/training" },
      ]}
    />
  );
}
