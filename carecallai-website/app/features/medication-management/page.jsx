import { Pill } from "lucide-react";
import FeaturePageLayout from "@/components/FeaturePageLayout";

export const metadata = {
  title: "Medication Management & MAR Charts",
  description:
    "Electronic MAR chart software for care agencies. PRN, pill pouch, refused & destroyed tracking with full audit trail. CIW & CQC compliant.",
  keywords: ["electronic MAR chart software", "medication management care", "care home MAR chart", "digital MAR chart UK"],
  openGraph: {
    title: "Electronic MAR Charts — CareCallAI",
    description: "PRN, pill pouch, refused & destroyed tracking with full audit trail. CIW & CQC compliant eMAR software.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Electronic MAR Charts — CareCallAI",
    description: "PRN, pill pouch, refused & destroyed tracking with full audit trail. CIW & CQC compliant eMAR software.",
  },
};

export default function MedicationManagementPage() {
  return (
    <FeaturePageLayout
      icon={Pill}
      title="Medication Management & MAR Charts"
      subtitle="Electronic MAR charts that eliminate medication errors"
      description="Replace paper MAR charts with a digital system that tracks every medication — given, refused or destroyed — with dose, frequency, time of day and the carer's initials."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "Medication Management" },
      ]}
      benefits={[
        { title: "Given / Refused / Destroyed", description: "Mark medications as Given (G), Refused (R) or Destroyed (D) — each shown in a different colour with the carer's initials." },
        { title: "Dose & timing visibility", description: "Every medication shows dose, frequency and time of day (Morning, Afternoon, Evening, Night, As Needed)." },
        { title: "PRN support", description: "Medications marked as PRN (as needed) display as coloured badges and are tracked separately from scheduled doses." },
        { title: "Pill pouch tracking", description: "Mark medications supplied in pre-packaged pill pouches for accurate dispensing records." },
        { title: "Care log integration", description: "MAR chart opens as a popup during care logging, with a clear Done button to return to the log." },
        { title: "Complete audit trail", description: "Every medication action is timestamped, signed and immutable — ready for inspection at any time." },
      ]}
      howItWorks={[
        { title: "Set up medications", description: "Add each client's medications with name, dose, frequency and time of day. Mark PRN and pill pouch medications." },
        { title: "Carers record administration", description: "During a visit, the carer opens the MAR chart (from the care log or directly), and signs each medication as Given, Refused or Destroyed." },
        { title: "Managers monitor compliance", description: "View the MAR chart for any client at any time. Missing entries, refusals and trends are immediately visible." },
      ]}
      faqs={[
        { question: "Can I record refused medications?", answer: "Yes. Carers can mark any medication as Refused (R) with their initials. This appears in amber on the MAR chart and is flagged for managers." },
        { question: "What about destroyed medications?", answer: "Destroyed medications are marked with (D) and appear in red. This is important for controlled drugs accountability." },
        { question: "Does the MAR chart work on mobile?", answer: "Yes. Carers access the MAR chart on their phone during visits. It scrolls properly and the sign/record buttons are always accessible." },
        { question: "Can I print the MAR chart?", answer: "Yes. MAR charts can be exported as PDF for records, GP meetings or inspections." },
      ]}
      relatedFeatures={[
        { name: "Care Logging", href: "/features/care-logging" },
        { name: "Compliance & Auditing", href: "/features/compliance" },
        { name: "Mobile App", href: "/features/mobile-app" },
      ]}
    />
  );
}
