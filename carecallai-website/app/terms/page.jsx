import { BreadcrumbJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Terms of Service",
  description: "CareCallAI terms of service. The terms and conditions governing your use of the platform.",
  alternates: { canonical: "https://www.carecallai.co.uk/terms" },
};

export default function TermsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Terms of Service" },
        ]}
      />
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 prose prose-slate">
          <h1>Terms of Service</h1>
          <p className="text-sm text-slate-500">Last updated: February 2026</p>

          <h2>1. Agreement</h2>
          <p>
            By accessing or using CareCallAI, you agree to be bound by these Terms of Service. If
            you are using CareCallAI on behalf of an organisation, you represent that you have the
            authority to bind that organisation to these terms.
          </p>

          <h2>2. Service Description</h2>
          <p>
            CareCallAI provides cloud-based home care management software including scheduling, care
            logging, medication management, staff management, compliance tracking and mobile
            applications.
          </p>

          <h2>3. Accounts</h2>
          <p>
            You are responsible for maintaining the security of your account credentials. You must
            not share login details with unauthorised individuals. You must notify us immediately of
            any unauthorised access to your account.
          </p>

          <h2>4. Subscriptions & Payment</h2>
          <ul>
            <li>Subscriptions are billed monthly or annually in advance</li>
            <li>Prices are in GBP and exclude VAT where applicable</li>
            <li>You can cancel at any time — access continues until the end of your billing period</li>
            <li>We may adjust pricing with 30 days&apos; written notice</li>
          </ul>

          <h2>5. Subscription</h2>
          <p>
            All plans are billed from the date of subscription. Your subscription gives you full
            access to all features included in your selected plan. You may cancel at any time
            from your account dashboard.
          </p>

          <h2>6. Your Data</h2>
          <p>
            You retain ownership of all data you enter into CareCallAI. We do not claim any
            intellectual property rights over your content. You can export your data at any time.
          </p>

          <h2>7. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to access another user&apos;s account</li>
            <li>Reverse-engineer, decompile or copy the software</li>
            <li>Upload malicious content or attempt to compromise system security</li>
          </ul>

          <h2>8. Availability & Support</h2>
          <p>
            We aim for 99.9% uptime but do not guarantee uninterrupted service. Scheduled
            maintenance will be communicated in advance. Support is available during business hours
            (Monday–Friday, 9am–5pm GMT).
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, CareCallAI shall not be liable for indirect,
            incidental or consequential damages. Our total liability shall not exceed the amount paid
            by you in the 12 months preceding the claim.
          </p>

          <h2>10. Termination</h2>
          <p>
            Either party may terminate this agreement with 30 days&apos; notice. We may suspend or
            terminate your account immediately if you breach these terms. Upon termination, your data
            will be retained for 30 days to allow export before deletion.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These terms are governed by the laws of England and Wales. Any disputes shall be resolved
            in the courts of England and Wales.
          </p>

          <h2>12. Contact</h2>
          <p>
            For questions about these terms, contact us at{" "}
            <a href="mailto:hello@carecallai.co.uk">hello@carecallai.co.uk</a>.
          </p>
        </div>
      </section>
    </>
  );
}
