import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Accredilink Community Response Taskforce. How we collect, use, store, and protect your personal data under UK GDPR and the Data Protection Act 2018.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(185,28,28,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Privacy Policy</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            How we collect, use, and protect your personal data. This policy explains your rights under UK GDPR and the Data Protection Act 2018.
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
                <strong className="text-slate-900">Cymraeg:</strong> Mae&apos;r polisi hwn ar gael yn Gymraeg ar gais. Cysylltwch a ni ar{' '}
                <a href="mailto:enquiries@accredilinkcare.co.uk" className="text-welsh-red font-medium hover:underline">enquiries@accredilinkcare.co.uk</a>{' '}
                i ofyn am gopi Cymraeg. This policy is available in Welsh on request.
              </p>
            </div>

            <h2 className="text-2xl mt-0">1. Who We Are</h2>
            <p>
              Accredilink Community Response Taskforce (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a not-for-profit organisation providing domiciliary care,
              respite care, sit-in services, emergency response, palliative care, social care, training, and event medical services
              across Denbighshire, Conwy, and Wrexham in North Wales.
            </p>
            <p>We are regulated by Care Inspectorate Wales (CIW) and registered with the Information Commissioner&apos;s Office (ICO).</p>
            <p>
              <strong>Registered address:</strong> The Hummingbird, 27-29 High St, Denbigh LL16 3HY<br />
              <strong>Phone:</strong> 01824 538688<br />
              <strong>Email:</strong>{' '}
              <a href="mailto:enquiries@accredilinkcare.co.uk">enquiries@accredilinkcare.co.uk</a><br />
              <strong>Website:</strong>{' '}
              <a href="https://accredilinkcare.co.uk">accredilinkcare.co.uk</a>
            </p>
            <p>
              For the purposes of data protection legislation, Accredilink Community Response Taskforce is the data controller.
            </p>

            <h2 className="text-2xl">2. What Personal Data We Collect</h2>
            <p>
              The types of personal data we collect depend on your relationship with us. We may collect the following categories of information:
            </p>

            <h3>Service users and their families</h3>
            <ul>
              <li>Full name, date of birth, address, and contact details</li>
              <li>Next of kin and emergency contact information</li>
              <li>Health and medical information, including diagnoses, medication, allergies, and GP details</li>
              <li>Care needs assessments and personalised care plans</li>
              <li>Mental capacity assessments and best interests decisions</li>
              <li>Daily care records, visit notes, and incident reports</li>
              <li>Information about your social care funding (local authority, CHC, or self-funding)</li>
              <li>Dietary requirements, religious or cultural preferences, and language preferences (including Welsh language)</li>
              <li>Photographs (only with explicit consent, for identification or care purposes)</li>
            </ul>

            <h3>Staff and job applicants</h3>
            <ul>
              <li>Full name, date of birth, address, and contact details</li>
              <li>National Insurance number and right-to-work documentation</li>
              <li>DBS (Disclosure and Barring Service) check results</li>
              <li>Social Care Wales registration details</li>
              <li>Qualifications, training records, and professional references</li>
              <li>Employment history and CV</li>
              <li>Health information relevant to fitness to work</li>
              <li>Bank details for payroll purposes</li>
              <li>Emergency contact details</li>
            </ul>

            <h3>Website visitors</h3>
            <ul>
              <li>Information you provide through our contact form (name, email, phone, message)</li>
              <li>Technical data such as IP address, browser type, and pages visited (see our{' '}
                <Link href="/cookie-policy">Cookie Policy</Link>)</li>
            </ul>

            <h3>Enquiries and referrals</h3>
            <ul>
              <li>Name, contact details, and nature of your enquiry</li>
              <li>Information about the person requiring care (if making a referral on behalf of someone else)</li>
            </ul>

            <h2 className="text-2xl">3. Lawful Basis for Processing</h2>
            <p>
              Under the UK General Data Protection Regulation (UK GDPR), we must have a lawful basis for processing your personal data.
              We rely on the following bases depending on the context:
            </p>
            <ul>
              <li>
                <strong>Contract:</strong> Processing is necessary for the performance of a care contract with you, or to take steps at your request before entering into a contract (Article 6(1)(b)).
              </li>
              <li>
                <strong>Legal obligation:</strong> Processing is necessary to comply with our legal obligations, including those under CIW regulations, the Social Services and Well-being (Wales) Act 2014, health and safety legislation, employment law, and safeguarding duties (Article 6(1)(c)).
              </li>
              <li>
                <strong>Vital interests:</strong> In an emergency, we may process your data to protect your life or the life of another person (Article 6(1)(d)).
              </li>
              <li>
                <strong>Legitimate interests:</strong> Processing is necessary for our legitimate interests, such as improving our services, training, quality assurance, and marketing (where this does not override your rights) (Article 6(1)(f)).
              </li>
              <li>
                <strong>Consent:</strong> Where none of the above bases apply, we will ask for your explicit consent before processing your data. You have the right to withdraw consent at any time (Article 6(1)(a)).
              </li>
            </ul>

            <h3>Special category data</h3>
            <p>
              Health and medical data is classified as &quot;special category data&quot; under UK GDPR and receives additional protections.
              We process this data on the following basis:
            </p>
            <ul>
              <li>It is necessary for the provision of health or social care (Article 9(2)(h))</li>
              <li>It is necessary for safeguarding purposes, to protect a vulnerable individual (Article 9(2)(c))</li>
              <li>You have given explicit consent (Article 9(2)(a))</li>
            </ul>

            <h2 className="text-2xl">4. How We Use Your Data</h2>
            <p>We use personal data for the following purposes:</p>
            <ul>
              <li>To assess your care needs and create a personalised care plan</li>
              <li>To deliver safe, effective domiciliary care and related services</li>
              <li>To manage your care on an ongoing basis, including reviews and updates</li>
              <li>To administer medication safely and maintain accurate records</li>
              <li>To communicate with you, your family, and relevant healthcare professionals</li>
              <li>To fulfil our regulatory obligations to Care Inspectorate Wales</li>
              <li>To comply with safeguarding duties and report concerns to the relevant authorities</li>
              <li>To process invoices, direct payments, and local authority or NHS funding</li>
              <li>To manage our workforce, including recruitment, training, supervision, and payroll</li>
              <li>To respond to enquiries and referrals</li>
              <li>To investigate complaints, incidents, and near-misses</li>
              <li>To improve the quality of our services through audit and quality assurance</li>
              <li>To maintain the security and functionality of our website</li>
            </ul>

            <h2 className="text-2xl">5. Who We Share Your Data With</h2>
            <p>
              We will never sell your personal data. We may share your data with the following parties where it is necessary
              and lawful to do so:
            </p>
            <ul>
              <li>
                <strong>Care Inspectorate Wales (CIW):</strong> As our regulator, CIW may access care records during inspections and investigations.
              </li>
              <li>
                <strong>Local authorities (Denbighshire, Conwy, Wrexham):</strong> Where your care is funded or commissioned by the local authority, or where we have safeguarding concerns.
              </li>
              <li>
                <strong>NHS Wales / Betsi Cadwaladr University Health Board:</strong> Where your care involves NHS Continuing Healthcare, or where we need to share information with your GP, district nurses, or hospital teams for your care.
              </li>
              <li>
                <strong>Social Care Wales:</strong> In relation to staff registration and fitness-to-practise matters.
              </li>
              <li>
                <strong>Safeguarding teams:</strong> Where we have concerns about abuse, neglect, or exploitation, we have a legal duty to share information with local authority safeguarding teams and, where necessary, the police.
              </li>
              <li>
                <strong>Emergency services:</strong> In an emergency, we will share relevant information with paramedics, hospital staff, and the police.
              </li>
              <li>
                <strong>IT and software providers:</strong> Our care management system and IT providers process data on our behalf under strict data processing agreements.
              </li>
              <li>
                <strong>DBS and referencing services:</strong> For staff recruitment and vetting.
              </li>
              <li>
                <strong>HMRC:</strong> For payroll and tax obligations.
              </li>
              <li>
                <strong>Professional advisors:</strong> Including our legal and insurance advisors, where necessary.
              </li>
              <li>
                <strong>Public Services Ombudsman for Wales:</strong> If you make a complaint that is escalated to the Ombudsman.
              </li>
            </ul>
            <p>
              All third parties who process data on our behalf are required to have appropriate security measures in place and
              to process data only in accordance with our instructions and applicable data protection law.
            </p>

            <h2 className="text-2xl">6. Data Retention</h2>
            <p>
              We retain personal data only for as long as necessary for the purposes for which it was collected, or as required by law.
              Our retention periods are as follows:
            </p>
            <ul>
              <li>
                <strong>Adult care records:</strong> Retained for 8 years after the last entry, or 3 years after the death of the service user (whichever is later), in line with NHS Wales and social care guidance.
              </li>
              <li>
                <strong>Safeguarding records:</strong> Retained for a minimum of 35 years, or indefinitely where abuse has been alleged or established.
              </li>
              <li>
                <strong>Staff employment records:</strong> Retained for 6 years after employment ends.
              </li>
              <li>
                <strong>Unsuccessful job applications:</strong> Retained for 6 months after the recruitment process concludes, then securely destroyed.
              </li>
              <li>
                <strong>Financial records:</strong> Retained for 7 years as required by HMRC.
              </li>
              <li>
                <strong>Complaint records:</strong> Retained for 10 years.
              </li>
              <li>
                <strong>Website enquiry data:</strong> Retained for 2 years, then securely deleted.
              </li>
            </ul>
            <p>
              When personal data is no longer needed, it is securely deleted or destroyed in accordance with our data disposal procedures.
            </p>

            <h2 className="text-2xl">7. Your Rights</h2>
            <p>
              Under the UK GDPR, you have the following rights in relation to your personal data:
            </p>
            <ul>
              <li>
                <strong>Right of access:</strong> You can request a copy of the personal data we hold about you (known as a Subject Access Request or SAR).
              </li>
              <li>
                <strong>Right to rectification:</strong> You can ask us to correct any personal data that is inaccurate or incomplete.
              </li>
              <li>
                <strong>Right to erasure:</strong> You can ask us to delete your personal data in certain circumstances (the &quot;right to be forgotten&quot;). This does not apply where we are legally required to retain the data.
              </li>
              <li>
                <strong>Right to restrict processing:</strong> You can ask us to limit how we use your data in certain circumstances.
              </li>
              <li>
                <strong>Right to data portability:</strong> You can request that we transfer your data to another provider in a structured, commonly used format.
              </li>
              <li>
                <strong>Right to object:</strong> You can object to our processing of your data where we rely on legitimate interests as our lawful basis.
              </li>
              <li>
                <strong>Rights related to automated decision-making:</strong> You have the right not to be subject to decisions based solely on automated processing. We do not currently use automated decision-making in our care services.
              </li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at:
            </p>

            <div className="not-prose my-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3">Data Protection Requests</h3>
              <p className="text-slate-600 text-sm mb-1"><strong>Email:</strong>{' '}
                <a href="mailto:enquiries@accredilinkcare.co.uk" className="text-welsh-red hover:underline">enquiries@accredilinkcare.co.uk</a>
              </p>
              <p className="text-slate-600 text-sm mb-1"><strong>Phone:</strong> 01824 538688</p>
              <p className="text-slate-600 text-sm mb-3">
                <strong>Post:</strong> Data Protection, Accredilink Community Response Taskforce, The Hummingbird, 27-29 High St, Denbigh LL16 3HY
              </p>
              <p className="text-slate-500 text-xs">
                We will respond to your request within one month. In complex cases, we may extend this by a further two months, but we will inform you if this is necessary.
              </p>
            </div>

            <p>
              If you are not satisfied with how we handle your request, you have the right to lodge a complaint with the
              Information Commissioner&apos;s Office (ICO):
            </p>
            <ul>
              <li><strong>Website:</strong>{' '}
                <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>
              </li>
              <li><strong>Phone:</strong> 0303 123 1113</li>
              <li><strong>Post:</strong> Information Commissioner&apos;s Office, Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF</li>
            </ul>

            <h2 className="text-2xl">8. Data Security</h2>
            <p>
              We take the security of your data seriously. We have implemented appropriate technical and organisational measures
              to protect your personal data against unauthorised access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul>
              <li>Encrypted electronic storage and secure access controls</li>
              <li>Password-protected systems with role-based access permissions</li>
              <li>Secure, locked storage for paper records</li>
              <li>Regular security assessments and software updates</li>
              <li>Mandatory data protection training for all staff</li>
              <li>Data processing agreements with all third-party IT providers</li>
              <li>Incident and data breach response procedures</li>
            </ul>
            <p>
              In the event of a personal data breach that poses a risk to your rights and freedoms, we will notify the ICO within
              72 hours and will inform you directly where required.
            </p>

            <h2 className="text-2xl">9. Cookies</h2>
            <p>
              Our website uses cookies to ensure it functions correctly and to improve your experience. For full details of the
              cookies we use, how we use them, and how you can manage your cookie preferences, please see our{' '}
              <Link href="/cookie-policy">Cookie Policy</Link>.
            </p>

            <h2 className="text-2xl">10. International Data Transfers</h2>
            <p>
              We do not routinely transfer personal data outside the United Kingdom. Where any data processing involves a transfer
              outside the UK (for example, through cloud-based software providers), we ensure that appropriate safeguards are in place,
              including adequacy decisions, standard contractual clauses, or binding corporate rules, as required by UK GDPR.
            </p>

            <h2 className="text-2xl">11. Children&apos;s Data</h2>
            <p>
              Our care services are primarily provided to adults. We do not knowingly collect personal data from children through
              our website. Where we do process children&apos;s data (for example, where a care user&apos;s family includes minors as next of kin),
              we do so in accordance with UK GDPR requirements and with appropriate safeguards.
            </p>

            <h2 className="text-2xl">12. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time to reflect changes in our practices, legal requirements, or
              regulatory guidance. The latest version will always be available on this page with the date of the last update
              shown at the top. We encourage you to review this policy periodically.
            </p>
            <p>
              Where changes are significant, we will make reasonable efforts to notify affected individuals directly.
            </p>

            <h2 className="text-2xl">13. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or how we handle your personal data, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong>{' '}
                <a href="mailto:enquiries@accredilinkcare.co.uk">enquiries@accredilinkcare.co.uk</a></li>
              <li><strong>Phone:</strong> 01824 538688</li>
              <li><strong>Post:</strong> Accredilink Community Response Taskforce, The Hummingbird, 27-29 High St, Denbigh LL16 3HY</li>
            </ul>
            <p>
              You can also use our{' '}
              <Link href="/contact">contact form</Link>{' '}
              to get in touch.
            </p>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Have a Question About Your Data?</h2>
          <p className="text-slate-600 mb-6">
            We are committed to transparency. If you have any concerns about how we handle your personal information, please get in touch.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3.5 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
