import { Bot } from "lucide-react";
import FeaturePageLayout from "@/components/FeaturePageLayout";

export const metadata = {
  title: "AI Assistant",
  description:
    "AI-powered care assistant for drafting care plans, risk assessments, compliance documentation and communication logs.",
  keywords: ["AI care software", "AI care plan writer", "care management AI assistant"],
  alternates: { canonical: "https://www.carecallai.co.uk/features/ai-assistant" },
  openGraph: {
    title: "AI Assistant — CareCallAI",
    description: "AI-powered care assistant for drafting care plans, risk assessments and compliance documentation.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Assistant — CareCallAI",
    description: "AI-powered care assistant for drafting care plans, risk assessments and compliance documentation.",
  },
};

export default function AIAssistantPage() {
  return (
    <FeaturePageLayout
      icon={Bot}
      title="AI Assistant"
      subtitle="AI that understands care — not just technology"
      description="CareCallAI's AI assistant helps with the time-consuming documentation work — drafting care plans, writing risk assessments, composing professional communications and generating compliance reports."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "AI Assistant" },
      ]}
      benefits={[
        { title: "Care plan drafting", description: "AI drafts person-centred care plans based on assessment data, saving hours of writing time." },
        { title: "Risk assessment help", description: "Generate comprehensive risk assessments from client information, covering mobility, medication, environment and more." },
        { title: "Professional communications", description: "Draft letters and emails to GPs, social workers and families with the right tone and terminology." },
        { title: "Report generation", description: "AI summarises care logs, incidents and trends into clear management reports." },
        { title: "Always learning", description: "The AI improves over time, learning your agency's preferred language and documentation style." },
        { title: "Human-in-the-loop", description: "AI drafts are always reviewed and edited by staff before saving. The AI assists — it doesn't replace professional judgement." },
      ]}
      howItWorks={[
        { title: "Open the AI assistant", description: "Access the AI from any client's profile, care plan or report page. It has context about the client." },
        { title: "Request a draft", description: "Ask the AI to draft a care plan, risk assessment or communication. It generates a comprehensive first draft in seconds." },
        { title: "Review and save", description: "Review the AI's draft, make any edits needed, and save. The final document is yours — the AI just saved you time getting there." },
      ]}
      faqs={[
        { question: "Which plans include the AI assistant?", answer: "The AI assistant is included in Enterprise and Compliance+ plans. It's available as an add-on for Professional plans." },
        { question: "Is my data used to train the AI?", answer: "No. Your client data is never used to train AI models. The AI processes your data in real time to generate drafts but does not retain or learn from it." },
        { question: "Can the AI write care plans?", answer: "The AI drafts care plans based on the information you provide. All drafts must be reviewed and approved by a qualified care professional before use." },
        { question: "Is the AI CIW/CQC compliant?", answer: "The AI generates documentation that follows CIW and CQC best practices. However, professional review is always required — the AI is a tool, not a replacement for clinical judgement." },
      ]}
      relatedFeatures={[
        { name: "Compliance & Auditing", href: "/features/compliance" },
        { name: "Care Logging", href: "/features/care-logging" },
        { name: "Staff Management", href: "/features/staff-management" },
      ]}
    />
  );
}
