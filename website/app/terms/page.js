import Link from 'next/link';

export const metadata = {
  title: 'Terms and Conditions',
  description: 'Terms and conditions for use of the Accredilink Community Response Taskforce website. Governing law, disclaimers, intellectual property, and limitations of liability.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/terms',
  },
};

export default function TermsPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(185,28,28,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Terms and Conditions</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Please read these terms carefully before using our website. By accessing and using this site, you agree to be bound by these terms.
          </p>
          <p className="mt-3 text-sm text-slate-400">Last updated: February 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-a:text-welsh-red prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900">

            {/* Welsh language note */}
            <div className="not-prose mb-10 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600">
                <strong className="text-slate-900">Cymraeg:</strong> Mae&apos;r telerau hyn ar gael yn Gymraeg ar gais.
                This document is available in Welsh on request. Please email{' '}
                <a href="mailto:enquiries@accredilinkcare.co.uk" className="text-welsh-red font-medium hover:underline">enquiries@accredilinkcare.co.uk</a>.
              </p>
            </div>

            <h2 className="text-2xl mt-0">1. Introduction</h2>
            <p>
              These terms and conditions (&quot;Terms&quot;) govern your use of the website operated by Accredilink Community Response
              Taskforce (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), accessible at{' '}
              <a href="https://accredilinkcare.co.uk">accredilinkcare.co.uk</a> (&quot;the Website&quot;).
            </p>
            <p>
              Accredilink Community Response Taskforce is a not-for-profit organisation providing care and support services
              across Denbighshire, Conwy, and Wrexham, North Wales. We are regulated by Care Inspectorate Wales (CIW).
            </p>
            <p>
              <strong>Registered address:</strong> The Hummingbird, 27-29 High St, Denbigh LL16 3HY<br />
              <strong>Phone:</strong> 01824 538688<br />
              <strong>Email:</strong>{' '}
              <a href="mailto:enquiries@accredilinkcare.co.uk">enquiries@accredilinkcare.co.uk</a>
            </p>
            <p>
              By accessing and using this Website, you confirm that you accept these Terms and agree to comply with them.
              If you do not agree to these Terms, you must not use the Website.
            </p>

            <h2 className="text-2xl">2. Use of the Website</h2>
            <p>
              This Website is provided for general information purposes about our care services, our organisation, and related
              topics. You may use the Website for lawful purposes only. You must not:
            </p>
            <ul>
              <li>Use the Website in any way that breaches any applicable local, national, or international law or regulation</li>
              <li>Use the Website in any way that is fraudulent or deceptive, or has any fraudulent or deceptive purpose or effect</li>
              <li>Transmit or procure the sending of any unsolicited advertising, promotional material, or spam through the Website</li>
              <li>Knowingly introduce viruses, trojans, worms, or other malicious or technologically harmful material</li>
              <li>Attempt to gain unauthorised access to the Website, its server, or any database connected to the Website</li>
              <li>Attack the Website via a denial-of-service attack or similar</li>
              <li>Use the Website to collect or harvest personal information of other users</li>
            </ul>
            <p>
              We reserve the right to restrict access to the Website, or parts of it, at our discretion without notice.
            </p>

            <h2 className="text-2xl">3. Our Services</h2>
            <p>
              The Website provides information about the care and support services we offer, including but not limited to:
            </p>
            <ul>
              <li>Domiciliary care (personal care at home)</li>
              <li>Respite care</li>
              <li>Sit-in services</li>
              <li>Emergency response</li>
              <li>Palliative care</li>
              <li>Social care</li>
              <li>Training and professional development</li>
              <li>Event medical services</li>
            </ul>
            <p>
              The information on this Website is intended to give you a general overview of our services. It does not constitute
              a contract for services. The specific terms of any care service will be set out in a separate care agreement
              between you (or the relevant commissioning body) and Accredilink Community Response Taskforce.
            </p>
            <p>
              All care services are subject to an initial assessment of need, availability, and our ability to safely meet
              the individual&apos;s requirements.
            </p>

            <h2 className="text-2xl">4. No Medical Advice</h2>
            <div className="not-prose my-6 p-5 bg-red-50 rounded-xl border border-red-200">
              <h3 className="font-bold text-slate-900 mb-2">Important Disclaimer</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                The content on this Website is provided for general informational purposes only. It is <strong>not</strong> intended
                to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your GP,
                consultant, or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed mt-2">
                Never disregard professional medical advice or delay seeking it because of something you have read on this Website.
                If you think you may have a medical emergency, call 999 or go to your nearest emergency department immediately.
              </p>
            </div>
            <p>
              While our team includes qualified emergency care responders and trained care professionals, the information
              provided on this Website does not constitute clinical advice. Our blog posts, guides, and service descriptions
              are for informational and educational purposes only.
            </p>

            <h2 className="text-2xl">5. Intellectual Property</h2>
            <p>
              All content on this Website, including but not limited to text, images, graphics, logos, icons, photographs,
              video, audio, software, and design, is the property of Accredilink Community Response Taskforce or our licensors
              and is protected by United Kingdom and international copyright, trademark, and other intellectual property laws.
            </p>
            <p>You may:</p>
            <ul>
              <li>View, download, and print pages from the Website for your own personal, non-commercial use</li>
              <li>Share links to pages on the Website</li>
            </ul>
            <p>You must not:</p>
            <ul>
              <li>Reproduce, duplicate, copy, sell, resell, or exploit any part of the Website for commercial purposes without our express written permission</li>
              <li>Modify, adapt, or create derivative works based on the Website content</li>
              <li>Remove any copyright, trademark, or proprietary notices from the Website content</li>
              <li>Frame or mirror any part of the Website on any other website or platform</li>
              <li>Use our name, logo, or branding in any way that suggests endorsement or affiliation without our written consent</li>
            </ul>
            <p>
              The Accredilink name, Accredilink Community Response Taskforce name, and associated logos are trademarks of
              Accredilink Community Response Taskforce. All rights are reserved.
            </p>

            <h2 className="text-2xl">6. Third-Party Links</h2>
            <p>
              The Website may contain links to third-party websites, including but not limited to Care Inspectorate Wales,
              Social Care Wales, NHS Wales, local authority websites, and other external resources. These links are provided
              for your convenience and information only.
            </p>
            <p>
              We have no control over the content, availability, or privacy practices of third-party websites. The inclusion
              of a link does not imply endorsement or approval of the linked website or its content. We accept no responsibility
              or liability for any loss or damage arising from your use of third-party websites.
            </p>

            <h2 className="text-2xl">7. Accuracy of Information</h2>
            <p>
              We make every reasonable effort to ensure that the information on this Website is accurate and up to date.
              However, we do not warrant or guarantee that:
            </p>
            <ul>
              <li>The content on the Website is complete, accurate, or current at all times</li>
              <li>The Website will be available without interruption</li>
              <li>The Website will be free from errors, viruses, or other harmful components</li>
            </ul>
            <p>
              Information about our services, availability, coverage areas, and pricing may change without notice. We recommend
              contacting us directly to confirm current service details before making decisions based on Website content.
            </p>

            <h2 className="text-2xl">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law:
            </p>
            <ul>
              <li>
                We exclude all conditions, warranties, representations, or other terms that may apply to the Website or any
                content on it, whether express or implied.
              </li>
              <li>
                We will not be liable to any user for any loss or damage, whether in contract, tort (including negligence),
                breach of statutory duty, or otherwise, even if foreseeable, arising under or in connection with the use of,
                or inability to use, the Website.
              </li>
              <li>
                We will not be liable for any indirect, consequential, special, or incidental loss or damage, including but
                not limited to loss of data, revenue, profits, business, anticipated savings, or goodwill.
              </li>
            </ul>
            <p>
              Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence,
              fraud or fraudulent misrepresentation, or any other liability that cannot be excluded or limited by the laws
              of England and Wales.
            </p>
            <p>
              These limitations of liability apply to the Website only. The provision of our care services is governed by
              separate care agreements and is subject to the regulatory requirements of Care Inspectorate Wales and applicable
              Welsh and UK legislation.
            </p>

            <h2 className="text-2xl">9. Indemnity</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Accredilink Community Response Taskforce, its officers,
              employees, agents, and volunteers from and against any claims, liabilities, damages, losses, and expenses
              (including reasonable legal fees) arising out of or in connection with your breach of these Terms or your
              misuse of the Website.
            </p>

            <h2 className="text-2xl">10. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Our use of your personal data is governed by our{' '}
              <Link href="/privacy-policy">Privacy Policy</Link>, which forms part of these Terms.
              Please read it carefully to understand how we collect, use, and protect your information.
            </p>
            <p>
              For information about the cookies we use, please see our{' '}
              <Link href="/cookie-policy">Cookie Policy</Link>.
            </p>

            <h2 className="text-2xl">11. Accessibility</h2>
            <p>
              We are committed to making this Website accessible to as many people as possible. For details of our accessibility
              standards and how to report any issues, please see our{' '}
              <Link href="/accessibility">Accessibility Statement</Link>.
            </p>

            <h2 className="text-2xl">12. Changes to These Terms</h2>
            <p>
              We may revise these Terms at any time by updating this page. The revised Terms will take effect from the date
              of publication on the Website. The date of the last update is shown at the top of this page.
            </p>
            <p>
              You are expected to check this page periodically to take notice of any changes. Your continued use of the
              Website after changes are posted constitutes acceptance of the revised Terms.
            </p>

            <h2 className="text-2xl">13. Severability</h2>
            <p>
              If any provision of these Terms is found by a court of competent jurisdiction to be invalid, illegal, or
              unenforceable, that provision shall be deemed modified to the minimum extent necessary to make it valid and
              enforceable. If it cannot be so modified, it shall be severed from these Terms. The invalidity of any provision
              shall not affect the validity and enforceability of the remaining provisions.
            </p>

            <h2 className="text-2xl">14. Entire Agreement</h2>
            <p>
              These Terms, together with our <Link href="/privacy-policy">Privacy Policy</Link> and{' '}
              <Link href="/cookie-policy">Cookie Policy</Link>, constitute the entire agreement between you and
              Accredilink Community Response Taskforce in relation to your use of the Website. They supersede all
              prior agreements, representations, and understandings.
            </p>
            <p>
              These Terms do not govern the provision of care services, which are subject to separate care agreements.
            </p>

            <h2 className="text-2xl">15. Governing Law and Jurisdiction</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of <strong>England and Wales</strong>.
            </p>
            <p>
              Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction
              of the courts of England and Wales.
            </p>

            <h2 className="text-2xl">16. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong>{' '}
                <a href="mailto:enquiries@accredilinkcare.co.uk">enquiries@accredilinkcare.co.uk</a></li>
              <li><strong>Phone:</strong> 01824 538688</li>
              <li><strong>Post:</strong> Accredilink Community Response Taskforce, The Hummingbird, 27-29 High St, Denbigh LL16 3HY</li>
            </ul>
            <p>
              You can also reach us through our{' '}
              <Link href="/contact">contact page</Link>.
            </p>

          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Related Policies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/privacy-policy" className="p-5 bg-white rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-sm transition-all text-center group">
              <p className="font-semibold text-slate-900 group-hover:text-welsh-red transition-colors">Privacy Policy</p>
              <p className="text-sm text-slate-500 mt-1">How we handle your data</p>
            </Link>
            <Link href="/cookie-policy" className="p-5 bg-white rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-sm transition-all text-center group">
              <p className="font-semibold text-slate-900 group-hover:text-welsh-red transition-colors">Cookie Policy</p>
              <p className="text-sm text-slate-500 mt-1">How we use cookies</p>
            </Link>
            <Link href="/accessibility" className="p-5 bg-white rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-sm transition-all text-center group">
              <p className="font-semibold text-slate-900 group-hover:text-welsh-red transition-colors">Accessibility</p>
              <p className="text-sm text-slate-500 mt-1">Our accessibility commitment</p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
