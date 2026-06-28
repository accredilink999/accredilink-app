import { BreadcrumbJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Privacy Policy",
  description: "CareCallAI privacy policy. How we collect, use and protect your data.",
  alternates: { canonical: "https://www.carecallai.co.uk/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Privacy Policy" },
        ]}
      />
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 prose prose-slate">
          <h1>Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last updated: February 2026</p>

          <h2>1. Who We Are</h2>
          <p>
            CareCallAI (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) provides home care management software for
            domiciliary care agencies in the United Kingdom. This policy explains how we collect,
            use and protect your personal data.
          </p>

          <h2>2. Data We Collect</h2>
          <p>We collect:</p>
          <ul>
            <li>Account information (name, email, phone, company name)</li>
            <li>Staff and client records entered by your organisation</li>
            <li>Care logs, medication records and incident reports</li>
            <li>Usage data and analytics (page views, feature usage)</li>
            <li>Device information for mobile app users</li>
          </ul>

          <h2>3. How We Use Your Data</h2>
          <p>We use your data to:</p>
          <ul>
            <li>Provide and improve the CareCallAI service</li>
            <li>Send important service notifications</li>
            <li>Provide customer support</li>
            <li>Generate anonymised analytics to improve the platform</li>
          </ul>

          <h2>4. Data Storage & Security</h2>
          <p>
            All data is stored securely using Supabase infrastructure with encryption at rest and in
            transit. We follow industry best practices for data security, including row-level
            security policies, encrypted backups and regular security audits.
          </p>

          <h2>5. Your Rights (GDPR)</h2>
          <p>Under UK GDPR, you have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Rectify inaccurate data</li>
            <li>Erase your data (&quot;right to be forgotten&quot;)</li>
            <li>Restrict processing of your data</li>
            <li>Data portability</li>
            <li>Object to processing</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. When you close your account,
            we delete your data within 30 days unless we are required by law to retain it for longer.
          </p>

          <h2>7. Third Parties</h2>
          <p>
            We do not sell your data. We share data only with service providers necessary to operate
            the platform (hosting, email delivery, payment processing).
          </p>

          <h2>8. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management. We do not use
            third-party advertising cookies.
          </p>

          <h2>9. Contact</h2>
          <p>
            For privacy enquiries, contact us at{" "}
            <a href="mailto:hello@carecallai.co.uk">hello@carecallai.co.uk</a>.
          </p>
        </div>
      </section>
    </>
  );
}
