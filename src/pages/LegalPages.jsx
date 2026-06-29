import { useState } from 'react';
import { ChevronLeft, FileText, Shield, Scale } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const TABS = [
  { key: 'terms', label: 'Terms of Service', icon: FileText },
  { key: 'privacy', label: 'Privacy Policy', icon: Shield },
  { key: 'ip', label: 'Intellectual Property', icon: Scale },
];

function TermsContent() {
  return (
    <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 space-y-4">
      <p className="text-xs text-slate-400">Last updated: March 2026</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Agreement</h3>
      <p>By accessing or using CareCallAI ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use the Service. These Terms constitute a legally binding agreement between you (or the organisation you represent) and CareCallAI.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Service Description</h3>
      <p>CareCallAI is a care management platform designed for domiciliary care providers and care homes. The Service provides staff management, electronic medication administration records (eMAR), rota scheduling, care logging, clinical assessments, compliance management, family portal access, and AI-powered features to support care delivery.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">3. Account Security</h3>
      <p>You are responsible for maintaining the confidentiality of your account credentials, including your password and any biometric authentication data stored on your device. You must notify us immediately of any unauthorised access to your account. CareCallAI is not liable for any loss or damage arising from your failure to safeguard your account credentials.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">4. Subscriptions and Payment</h3>
      <p>CareCallAI offers subscription-based access. Subscriptions auto-renew at the end of each billing cycle unless cancelled at least 24 hours before the renewal date. Payment is processed via Stripe. Prices may change with 30 days' written notice. You may cancel your subscription at any time through the app Settings page or by contacting support.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">5. Free Trial</h3>
      <p>New organisations receive a 14-day free trial with full access to all features. No credit card is required during the trial period. At the end of the trial, access to the Service will be restricted until a subscription is activated.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">6. Data Ownership and Export</h3>
      <p>You retain full ownership of all data you enter into CareCallAI, including staff records, client records, care logs, assessments, and documents. We do not claim any intellectual property rights over your content. You may export your data at any time. Upon account deletion, your data will be retained for 30 days to allow recovery, after which it will be permanently deleted.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">7. Acceptable Use</h3>
      <p>You agree to use CareCallAI only for lawful purposes and in accordance with applicable regulations, including CIW (Care Inspectorate Wales) and CQC (Care Quality Commission) standards. You must not: (a) use the Service to store, transmit, or distribute unlawful content; (b) attempt to gain unauthorised access to other accounts or systems; (c) reverse engineer, decompile, or disassemble any part of the Service; (d) use the Service in any way that could damage, disable, or impair its functionality.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">8. Availability and Support</h3>
      <p>We aim for 99.9% uptime. Scheduled maintenance will be announced in advance. Support is available via in-app messaging, email at support@carecallai.co.uk, and WhatsApp. We do not guarantee uninterrupted service and will not be liable for downtime caused by factors outside our reasonable control.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">9. Limitation of Liability</h3>
      <p>To the maximum extent permitted by law, CareCallAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of revenue, data, or business opportunities. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim. Nothing in these Terms excludes liability for death, personal injury caused by negligence, fraud, or any liability that cannot be excluded by law.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">10. Termination</h3>
      <p>Either party may terminate this agreement with 30 days' written notice. We may suspend or terminate your account immediately if you breach these Terms. Upon termination, your right to use the Service ceases, and your data will be available for export for 30 days.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">11. Changes to Terms</h3>
      <p>We may update these Terms from time to time. Material changes will be notified via email or in-app notification at least 14 days before taking effect. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">12. Governing Law</h3>
      <p>These Terms are governed by the laws of England and Wales. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">13. Contact</h3>
      <p>For questions about these Terms, contact us at:<br />
      Email: support@carecallai.co.uk<br />
      WhatsApp: +44 7762 533406<br />
      Website: carecallai.co.uk</p>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 space-y-4">
      <p className="text-xs text-slate-400">Last updated: March 2026</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Who We Are</h3>
      <p>CareCallAI is a UK-based care management platform. We are the data controller for personal data collected through the Service. For data entered by organisations about their staff and clients, the organisation is the data controller and CareCallAI acts as a data processor.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Data We Collect</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Account information:</strong> name, email address, role, job title</li>
        <li><strong>Staff records:</strong> employment details, qualifications, training records, DBS information</li>
        <li><strong>Client records:</strong> personal details, care plans, medical information, next of kin</li>
        <li><strong>Care logs:</strong> visit records, medication administration, clinical observations</li>
        <li><strong>Device information:</strong> device type, operating system, push notification tokens</li>
        <li><strong>Location data:</strong> GPS coordinates during clock-in/clock-out for visit verification (with your consent)</li>
        <li><strong>Biometric data:</strong> fingerprint or face recognition data is stored locally on your device only — we never receive or store biometric data on our servers</li>
        <li><strong>Usage data:</strong> pages visited, features used, error logs (anonymised)</li>
      </ul>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">3. How We Use Your Data</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>To provide and operate the care management Service</li>
        <li>To send notifications about shifts, incidents, and important events</li>
        <li>To verify staff attendance and visit completion via GPS</li>
        <li>To generate reports and analytics for care compliance</li>
        <li>To improve our Service and develop new features</li>
        <li>To communicate with you about your account and support requests</li>
      </ul>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">4. Legal Basis for Processing (UK GDPR)</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Contract:</strong> processing necessary to provide the Service you have subscribed to</li>
        <li><strong>Legitimate interest:</strong> improving our Service, preventing fraud, ensuring security</li>
        <li><strong>Consent:</strong> location tracking, push notifications, marketing communications</li>
        <li><strong>Legal obligation:</strong> retaining records as required by care sector regulations</li>
      </ul>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">5. Data Storage and Security</h3>
      <p>Your data is stored securely on Supabase infrastructure with:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Encryption at rest and in transit (TLS 1.3)</li>
        <li>Row-level security (RLS) policies ensuring data isolation between organisations</li>
        <li>Regular encrypted backups</li>
        <li>Access controls and audit logging</li>
      </ul>
      <p>Data is stored within the European Economic Area (EEA). Where data is transferred outside the EEA, appropriate safeguards are in place, including Standard Contractual Clauses.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">6. Your Rights Under UK GDPR</h3>
      <p>You have the right to:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Access:</strong> request a copy of the personal data we hold about you</li>
        <li><strong>Rectification:</strong> correct any inaccurate or incomplete data</li>
        <li><strong>Erasure:</strong> request deletion of your data ("right to be forgotten")</li>
        <li><strong>Restrict processing:</strong> limit how we use your data</li>
        <li><strong>Data portability:</strong> receive your data in a structured, machine-readable format</li>
        <li><strong>Object:</strong> object to processing based on legitimate interests or direct marketing</li>
        <li><strong>Withdraw consent:</strong> withdraw consent at any time where processing is based on consent</li>
      </ul>
      <p>To exercise any of these rights, contact us at support@carecallai.co.uk. We will respond within 30 days.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">7. Data Retention</h3>
      <p>We retain your data for as long as your account is active or as needed to provide the Service. After account deletion, data is retained for 30 days to allow recovery, then permanently deleted. Care records may be retained longer where required by law or regulation (e.g., CIW/CQC record-keeping requirements).</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">8. Data Breach Notification</h3>
      <p>In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will notify the Information Commissioner's Office (ICO) within 72 hours and affected individuals without undue delay, in accordance with UK GDPR Article 33 and 34.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">9. Third-Party Processors</h3>
      <p>We use the following third-party processors:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Supabase:</strong> database hosting and authentication</li>
        <li><strong>Vercel:</strong> web application hosting</li>
        <li><strong>Stripe:</strong> payment processing</li>
        <li><strong>Firebase/Google:</strong> push notifications (Android/Web)</li>
        <li><strong>Apple Push Notification Service:</strong> push notifications (iOS)</li>
        <li><strong>Ionos:</strong> email delivery</li>
        <li><strong>Anthropic (Claude AI):</strong> AI-powered features (no personal data is stored by Anthropic)</li>
      </ul>
      <p>We do not sell your personal data to any third party.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">10. Cookies</h3>
      <p>CareCallAI uses essential cookies only for authentication and session management. We do not use advertising or tracking cookies within the application. Our marketing website may use analytics cookies with your consent.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">11. Children's Privacy</h3>
      <p>CareCallAI is not intended for use by individuals under the age of 16. We do not knowingly collect personal data from children.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">12. Contact and Complaints</h3>
      <p>For privacy enquiries: support@carecallai.co.uk<br />
      If you are not satisfied with our response, you have the right to lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk.</p>
    </div>
  );
}

function IPContent() {
  return (
    <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 space-y-4">
      <p className="text-xs text-slate-400">Last updated: March 2026</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Platform Ownership</h3>
      <p>The CareCallAI platform, including all software, source code, algorithms, user interface designs, graphics, icons, and documentation, is the exclusive intellectual property of CareCallAI and is protected by copyright, trademark, and other intellectual property laws of England and Wales and international treaties.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Trademarks</h3>
      <p>"CareCallAI", the CareCallAI logo, and all related names, logos, product and service names, designs, and slogans are trademarks of CareCallAI. You may not use these marks without our prior written permission. All other names, logos, product and service names, designs, and slogans are the trademarks of their respective owners.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">3. Your Data and Content</h3>
      <p>You retain full ownership of all data, records, and content you enter into CareCallAI. By using the Service, you grant CareCallAI a limited, non-exclusive licence to process and store your data solely for the purpose of providing the Service to you. This licence terminates when you delete your account or data.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">4. Licence to Use</h3>
      <p>Subject to these Terms, CareCallAI grants you a limited, non-exclusive, non-transferable, revocable licence to access and use the Service for your internal business purposes. This licence does not include the right to:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Copy, modify, or create derivative works of the Service or any part thereof</li>
        <li>Reverse engineer, decompile, disassemble, or attempt to discover the source code</li>
        <li>Sell, sublicence, lease, or redistribute the Service or access to it</li>
        <li>Use the Service to build a competing product or service</li>
        <li>Remove, alter, or obscure any proprietary notices or labels</li>
      </ul>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">5. AI-Generated Content</h3>
      <p>CareCallAI uses artificial intelligence to generate care suggestions, compliance guidance, risk assessments, and other content. AI-generated outputs are provided as decision-support tools and should always be reviewed by qualified care professionals. You retain ownership of any AI-generated content created using your data within the Service.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">6. Feedback and Suggestions</h3>
      <p>If you provide feedback, suggestions, or ideas about the Service, you grant CareCallAI an irrevocable, non-exclusive, royalty-free licence to use, develop, and implement those suggestions without obligation to you. This does not apply to your confidential business data.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">7. Third-Party Components</h3>
      <p>The Service may include open-source software components subject to their respective licences. A list of open-source components and their licences is available upon request.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">8. API and Integration Rights</h3>
      <p>Any use of the CareCallAI API is subject to these Terms and any additional API-specific terms. You may not use the API to extract data for purposes outside the scope of the Service or to build products that compete with CareCallAI.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">9. Enforcement</h3>
      <p>CareCallAI reserves the right to take appropriate legal action against any unauthorised use of the Service or infringement of our intellectual property rights. We may terminate your access to the Service if we reasonably believe you have infringed our intellectual property rights.</p>

      <h3 className="text-base font-bold text-slate-900 dark:text-white">10. Contact</h3>
      <p>For intellectual property enquiries, contact us at:<br />
      Email: support@carecallai.co.uk<br />
      Website: carecallai.co.uk</p>
    </div>
  );
}

export default function LegalPages({ initialTab, embedded = false }) {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || initialTab || 'terms');
  const navigate = useNavigate();
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="max-w-3xl mx-auto pb-8">
      {/* Header — hidden when embedded inside OrgAdmin */}
      {!embedded && (
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} transition-colors`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Legal</h1>
        </div>
      )}

      {/* Tab bar */}
      <div className={`flex gap-1 p-1 rounded-xl mb-5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? isDark
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-300'
                    : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.key === 'terms' ? 'Terms' : tab.key === 'privacy' ? 'Privacy' : 'IP'}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className={`rounded-xl border p-5 sm:p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        {activeTab === 'terms' && <TermsContent />}
        {activeTab === 'privacy' && <PrivacyContent />}
        {activeTab === 'ip' && <IPContent />}
      </div>

      {/* Footer */}
      <p className={`text-xs text-center mt-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        For questions, contact support@carecallai.co.uk
      </p>
    </div>
  );
}
