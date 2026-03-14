import { MapPin, QrCode, Globe, Receipt, Clock, Navigation, Shield, Smartphone } from "lucide-react";
import FeaturePageLayout from "@/components/FeaturePageLayout";

export const metadata = {
  title: "GPS Check-In, QR Codes & Live Tracking",
  description:
    "GPS-verified call check-in and check-out, QR code scanning, live staff tracking and automatic mileage logging for fuel expenses. Built for UK domiciliary care.",
  keywords: ["care worker GPS tracking", "home care check in check out", "care worker live tracking", "QR code care check in", "care mileage tracker"],
  alternates: { canonical: "https://carecallai.co.uk/features/gps-tracking" },
  openGraph: {
    title: "GPS Tracking & QR Check-In — CareCallAI",
    description: "GPS-verified check-in/out, QR scanning, live tracking and automatic mileage logging for care workers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GPS Tracking & QR Check-In — CareCallAI",
    description: "GPS-verified check-in/out, QR scanning, live tracking and automatic mileage logging for care workers.",
  },
};

export default function GPSTrackingPage() {
  return (
    <FeaturePageLayout
      icon={MapPin}
      title="GPS Check-In, QR Codes & Live Tracking"
      subtitle="Know exactly where your carers are and when they arrive"
      description="CareCallAI uses GPS and QR code scanning to verify every call check-in and check-out. Managers get live staff locations, and mileage is logged automatically for fuel expense claims — no manual entry needed."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "GPS Tracking" },
      ]}
      benefits={[
        { title: "GPS Check-In / Check-Out", description: "Carers tap 'Check In' when they arrive and 'Check Out' when they leave. GPS coordinates and timestamp are captured automatically." },
        { title: "QR Code Scanning", description: "Place a unique QR code at each client's home or on their care plan. Carers scan it with their phone camera to instantly check in — fast, tamper-proof and verifiable." },
        { title: "Live Staff Tracking", description: "Managers can see all active carers on a real-time map. Know who is on route, who is at a call and who has finished for the day." },
        { title: "Automatic Mileage Logging", description: "Journey distances between calls are calculated automatically. No more paper mileage forms — fuel expenses are ready to approve at the end of each week." },
        { title: "Geofence Verification", description: "Set a radius around each client address (e.g. 50m). The system confirms the carer is within range before allowing check-in." },
        { title: "Fuel Expense Claims", description: "Mileage data feeds directly into the expenses module. Staff see their accumulated mileage and managers approve claims with one click." },
      ]}
      howItWorks={[
        { title: "Carer arrives at the client's home", description: "The app detects their GPS location. They either tap 'Check In' or scan the client's QR code. The system verifies they're within range and records the timestamp." },
        { title: "Care visit takes place", description: "During the visit, the carer logs care as normal. Their location status shows as 'At Call' on the manager's live tracking map." },
        { title: "Carer checks out and travels to the next call", description: "On leaving, they tap 'Check Out'. The system records the departure time, calculates visit duration and logs the mileage to the next call automatically." },
      ]}
      faqs={[
        { question: "How accurate is the GPS check-in?", answer: "GPS accuracy is typically within 5-15 metres on modern smartphones. You can configure the geofence radius (e.g. 50m, 100m) to suit your needs." },
        { question: "What if a carer has poor GPS signal?", answer: "If GPS is unavailable (e.g. inside a building), carers can use QR code scanning as an alternative check-in method. Both methods are equally valid for audit purposes." },
        { question: "How do QR codes work?", answer: "Each client is assigned a unique QR code. You print it and place it at their home (e.g. on the care plan folder or by the front door). Carers open the CareCallAI app, scan the code and they're checked in instantly." },
        { question: "Can I see where all my carers are right now?", answer: "Yes. The live tracking map shows all active carers with their current status — travelling, at call, or finished. You can filter by area." },
        { question: "How does mileage logging work?", answer: "The system calculates the distance between consecutive check-in locations. This is logged as mileage for the carer, which feeds into their weekly fuel expense claim." },
        { question: "Is location data stored securely?", answer: "Yes. Location data is encrypted in transit and at rest. It's only accessible to authorised managers and is retained according to your data retention policy." },
      ]}
      relatedFeatures={[
        { name: "Scheduling & Rota", href: "/features/scheduling" },
        { name: "Care Logging", href: "/features/care-logging" },
        { name: "Mobile App", href: "/features/mobile-app" },
        { name: "Invoicing & Payroll", href: "/features/invoicing-payroll" },
      ]}
    />
  );
}
