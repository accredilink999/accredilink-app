import { Calendar } from "lucide-react";
import FeaturePageLayout from "@/components/FeaturePageLayout";

export const metadata = {
  title: "Scheduling & Rota Management",
  description:
    "CareCallAI scheduling software for domiciliary care. Multi-area rotas, shift patterns, one-off calls, drag-and-drop scheduling and base templates.",
  keywords: ["care rostering software UK", "home care scheduling", "care staff rota software", "domiciliary care scheduling"],
  alternates: { canonical: "https://www.carecallai.co.uk/features/scheduling" },
  openGraph: {
    title: "Scheduling & Rota Management — CareCallAI",
    description: "Multi-area rotas, shift patterns, drag-and-drop scheduling. Built for UK domiciliary care agencies.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scheduling & Rota Management — CareCallAI",
    description: "Multi-area rotas, shift patterns, drag-and-drop scheduling. Built for UK domiciliary care agencies.",
  },
};

export default function SchedulingPage() {
  return (
    <FeaturePageLayout
      icon={Calendar}
      title="Scheduling & Rota Management"
      subtitle="Build, manage and deploy rotas across multiple areas in minutes"
      description="Stop wrestling with spreadsheets. CareCallAI's rota management lets you create shift patterns, assign carers to areas, add one-off calls and deploy entire weeks with a single click."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "Scheduling & Rota" },
      ]}
      benefits={[
        { title: "Multi-area support", description: "Separate rotas for different geographic areas with independent shift types and call types." },
        { title: "Shift patterns", description: "Create reusable patterns (e.g. 2 weeks on, 1 week off) and auto-generate rotas from them." },
        { title: "Base templates", description: "Save ideal week templates and deploy them across any date range with one click." },
        { title: "One-off calls", description: "Add single impromptu visits without affecting the regular schedule." },
        { title: "Drag and drop", description: "Move shifts and calls between staff visually on the day, week or month view." },
        { title: "Not at Home tracking", description: "Separate 'Not at Home' status (amber) from 'Missed' (red) for accurate reporting." },
      ]}
      howItWorks={[
        { title: "Set up your areas", description: "Create rota areas (e.g. North, South, Llangollen) each with their own shift types, call types and staff." },
        { title: "Build shift patterns", description: "Define recurring patterns for each area. CareCallAI generates the rota automatically from your patterns." },
        { title: "Fine-tune and publish", description: "Review the generated rota, make any one-off changes, add impromptu calls, then publish. Staff see their schedule on the mobile app." },
      ]}
      faqs={[
        { question: "Can I manage multiple areas separately?", answer: "Yes. Each rota area has its own shift types, call types, base templates and staff. Changes in one area don't affect others." },
        { question: "How do carers see their rota?", answer: "Carers open the CareCallAI mobile app and see their shifts, calls and client details for the day/week. They receive push notifications for any changes." },
        { question: "Can I add a one-off visit?", answer: "Yes. From any client's profile, you can add a single one-off call to any date without creating a recurring pattern." },
        { question: "Does it handle night shifts?", answer: "Yes. Shifts can span midnight (e.g. 22:00-06:00) and are displayed correctly on all rota views." },
      ]}
      relatedFeatures={[
        { name: "Care Logging", href: "/features/care-logging" },
        { name: "Staff Management", href: "/features/staff-management" },
        { name: "Mobile App", href: "/features/mobile-app" },
        { name: "Free Staff Training", href: "/training" },
      ]}
    />
  );
}
