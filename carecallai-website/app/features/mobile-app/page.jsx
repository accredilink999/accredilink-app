import { Smartphone } from "lucide-react";
import FeaturePageLayout from "@/components/FeaturePageLayout";

export const metadata = {
  title: "Mobile App for Care Workers",
  description:
    "CareCallAI mobile app for iOS and Android. Care workers view rotas, log visits, complete MAR charts, report incidents and receive push notifications.",
  keywords: ["care worker mobile app", "home care app", "carer scheduling app", "mobile care logging app UK"],
  alternates: { canonical: "https://www.carecallai.co.uk/features/mobile-app" },
  openGraph: {
    title: "Mobile App for Care Workers — CareCallAI",
    description: "iOS & Android app. View rotas, log visits, complete MAR charts, report incidents and get push notifications.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mobile App for Care Workers — CareCallAI",
    description: "iOS & Android app. View rotas, log visits, complete MAR charts, report incidents and get push notifications.",
  },
};

export default function MobileAppPage() {
  return (
    <FeaturePageLayout
      icon={Smartphone}
      title="Mobile App"
      subtitle="Everything your carers need, right in their pocket"
      description="The CareCallAI mobile app gives care workers instant access to their rota, care logging, MAR charts and incident reporting — all from their iOS or Android phone."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "Mobile App" },
      ]}
      benefits={[
        { title: "Rota at a glance", description: "Carers see their daily and weekly schedule with client names, addresses, times and call types." },
        { title: "One-tap care logging", description: "Start a care log with one tap when arriving at a visit. The app guides them through what to record." },
        { title: "MAR chart on mobile", description: "Complete the MAR chart during a visit with a scrollable, touch-friendly interface." },
        { title: "Push notifications", description: "Receive instant alerts for rota changes, new messages, incidents and shift reminders." },
        { title: "Notification deep linking", description: "Tapping a notification takes the carer directly to the relevant page — not just the home screen." },
        { title: "Works on any device", description: "Native iOS and Android apps, plus a full web version that works on any browser." },
      ]}
      howItWorks={[
        { title: "Download and log in", description: "Care workers download CareCallAI from the App Store or Google Play and log in with their credentials." },
        { title: "View today's visits", description: "The app shows today's rota with all client details, addresses and scheduled times." },
        { title: "Complete visits", description: "At each visit, the carer logs care provided, records medications and submits — all from their phone." },
      ]}
      faqs={[
        { question: "Is the app free for care workers?", answer: "Yes. The mobile app is included in every CareCallAI plan at no extra cost. There's no per-device fee." },
        { question: "Does it work offline?", answer: "The app can function with limited connectivity. Logs are saved locally and synced when the device reconnects." },
        { question: "Which phones are supported?", answer: "CareCallAI works on iOS 14+ and Android 8+. It's also accessible as a web app on any modern browser." },
        { question: "Are push notifications included?", answer: "Yes. Push notifications are available on Professional plans and above for both iOS and Android." },
      ]}
      relatedFeatures={[
        { name: "Scheduling & Rota", href: "/features/scheduling" },
        { name: "Care Logging", href: "/features/care-logging" },
        { name: "Medication / MAR Charts", href: "/features/medication-management" },
      ]}
    />
  );
}
