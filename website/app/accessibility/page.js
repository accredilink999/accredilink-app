import Link from 'next/link';

export const metadata = {
  title: 'Accessibility Statement',
  description: 'Accessibility statement for the Accredilink Community Response Taskforce website. Our commitment to WCAG 2.1 AA compliance and digital accessibility.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/accessibility',
  },
};

export default function AccessibilityPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(185,28,28,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Accessibility Statement</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Our commitment to making this website accessible to everyone, including people with disabilities.
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
                <strong className="text-slate-900">Cymraeg:</strong> Mae&apos;r datganiad hwn ar gael yn Gymraeg ar gais.
                This statement is available in Welsh on request. Please email{' '}
                <a href="mailto:enquiries@accredilinkcare.co.uk" className="text-welsh-red font-medium hover:underline">enquiries@accredilinkcare.co.uk</a>.
              </p>
            </div>

            <h2 className="text-2xl mt-0">1. Our Commitment</h2>
            <p>
              Accredilink Community Response Taskforce is committed to ensuring that our website,{' '}
              <a href="https://accredilinkcare.co.uk">accredilinkcare.co.uk</a>, is accessible to the widest possible
              audience, including people with disabilities. We believe that everyone has the right to access information
              about care services, and we strive to provide an inclusive digital experience.
            </p>
            <p>
              As a care provider serving communities across Denbighshire, Conwy, and Wrexham in North Wales, we recognise
              that many of the people who visit our website may be older adults, people with disabilities, or family members
              and carers who need clear and accessible information. Accessibility is not an afterthought for us — it is a
              core part of how we deliver our services, both online and offline.
            </p>
            <p>
              We aim to comply with the <strong>Web Content Accessibility Guidelines (WCAG) 2.1</strong> at <strong>Level AA</strong>,
              as recommended by the UK Government and the Equality and Human Rights Commission.
            </p>

            <h2 className="text-2xl">2. What We Have Done</h2>
            <p>
              We have taken the following steps to make our website accessible:
            </p>

            <h3>Design and layout</h3>
            <ul>
              <li>Used a clear, consistent layout across all pages with logical heading structure</li>
              <li>Ensured sufficient colour contrast between text and background colours throughout the site</li>
              <li>Designed all pages to be fully responsive, working on mobile phones, tablets, and desktop computers</li>
              <li>Used readable font sizes with the ability to resize text using browser controls without loss of content</li>
              <li>Avoided content that flashes or blinks, which could cause seizures in people with photosensitive epilepsy</li>
            </ul>

            <h3>Navigation and structure</h3>
            <ul>
              <li>Provided a clear, consistent navigation menu that works with keyboard navigation</li>
              <li>Used semantic HTML elements (headings, lists, landmarks) to help screen reader users understand page structure</li>
              <li>Ensured all interactive elements (links, buttons, forms) are accessible via keyboard</li>
              <li>Included descriptive link text so that links make sense out of context</li>
              <li>Provided skip-to-content functionality where appropriate</li>
            </ul>

            <h3>Images and media</h3>
            <ul>
              <li>Added alternative text (alt text) to all meaningful images</li>
              <li>Used decorative images appropriately, marked so screen readers can skip them</li>
              <li>Ensured images do not contain text that is not available in another format</li>
            </ul>

            <h3>Forms and interaction</h3>
            <ul>
              <li>Labelled all form fields clearly and associated labels with their inputs</li>
              <li>Provided clear error messages and instructions when form submissions fail</li>
              <li>Ensured all form controls are accessible with keyboard and screen readers</li>
            </ul>

            <h3>Content</h3>
            <ul>
              <li>Written content in plain English, avoiding unnecessary jargon</li>
              <li>Structured content with clear headings, short paragraphs, and bulleted lists for easy scanning</li>
              <li>Provided contact information in multiple formats (phone, email, online form) so people can reach us in the way that works best for them</li>
            </ul>

            <h2 className="text-2xl">3. Accessibility Features</h2>
            <p>The following features are available on our website to support accessibility:</p>

            <div className="not-prose my-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Keyboard Navigation', desc: 'All pages and interactive elements can be navigated using a keyboard alone, without requiring a mouse.' },
                { title: 'Screen Reader Compatibility', desc: 'The site uses semantic HTML and ARIA attributes to work with popular screen readers such as JAWS, NVDA, and VoiceOver.' },
                { title: 'Text Resizing', desc: 'You can increase or decrease text size using your browser\'s built-in zoom controls (Ctrl/Cmd + or -) without loss of content or functionality.' },
                { title: 'Responsive Design', desc: 'The website adapts to different screen sizes and orientations, and works on mobile devices, tablets, and desktops.' },
                { title: 'Colour Contrast', desc: 'Text and interactive elements meet WCAG 2.1 AA minimum contrast ratios for readability.' },
                { title: 'Focus Indicators', desc: 'Visible focus indicators are displayed when navigating with a keyboard, so you can see which element is currently selected.' },
              ].map((feature) => (
                <div key={feature.title} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl">4. Known Limitations</h2>
            <p>
              Despite our best efforts, there may be some areas of the website that are not yet fully accessible.
              We are aware of the following limitations and are working to address them:
            </p>
            <ul>
              <li>
                <strong>PDF documents:</strong> Some downloadable documents may not be fully accessible to screen readers.
                We are working to ensure all new documents meet accessibility standards. If you need information from a
                PDF in an alternative format, please contact us.
              </li>
              <li>
                <strong>Older content:</strong> Some older blog posts or pages may not have been fully reviewed for
                accessibility. We are auditing and updating content on an ongoing basis.
              </li>
              <li>
                <strong>Third-party content:</strong> Some embedded content from third-party services (such as maps or
                social media feeds) may not meet all accessibility standards. We have limited control over the accessibility
                of third-party content but choose providers with accessibility in mind where possible.
              </li>
              <li>
                <strong>Complex tables or data:</strong> Where tables are used for data presentation, some may not yet
                have full row and column header associations for screen readers.
              </li>
            </ul>
            <p>
              We are committed to continuous improvement and will address these limitations as part of our ongoing
              accessibility review programme.
            </p>

            <h2 className="text-2xl">5. How to Get Information in an Accessible Format</h2>
            <p>
              If you have difficulty accessing any content on this website, or if you need information in an alternative
              format, we are happy to help. We can provide information in the following formats on request:
            </p>
            <ul>
              <li>Large print</li>
              <li>Audio format</li>
              <li>Easy read</li>
              <li>Welsh language (Cymraeg)</li>
              <li>Other formats on request</li>
            </ul>
            <p>
              Please contact us and we will do our best to accommodate your needs within a reasonable timeframe.
            </p>

            <h2 className="text-2xl">6. Reporting Accessibility Issues</h2>
            <p>
              We welcome feedback about the accessibility of our website. If you encounter any accessibility barriers
              or have suggestions for improvement, please let us know:
            </p>

            <div className="not-prose my-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3">Report an Accessibility Issue</h3>
              <p className="text-slate-600 text-sm mb-1"><strong>Email:</strong>{' '}
                <a href="mailto:enquiries@accredilinkcare.co.uk" className="text-welsh-red hover:underline">enquiries@accredilinkcare.co.uk</a>
              </p>
              <p className="text-slate-600 text-sm mb-1"><strong>Phone:</strong> 01824 538688</p>
              <p className="text-slate-600 text-sm mb-3">
                <strong>Post:</strong> Accessibility, Accredilink Community Response Taskforce, The Hummingbird, 27-29 High St, Denbigh LL16 3HY
              </p>
              <p className="text-slate-500 text-xs">
                When reporting an issue, it helps if you can describe the problem you experienced, the page URL, the device
                and browser you were using, and any assistive technology you use. We aim to respond to accessibility feedback
                within 5 working days.
              </p>
            </div>

            <p>
              You can also use our{' '}
              <Link href="/contact">contact form</Link>{' '}
              to report accessibility issues.
            </p>

            <h2 className="text-2xl">7. Enforcement Procedure</h2>
            <p>
              If you are not satisfied with our response to your accessibility concern, you can contact the{' '}
              <strong>Equality and Human Rights Commission (EHRC)</strong> for further advice and assistance.
            </p>
            <p>
              The EHRC is responsible for enforcing the Public Sector Bodies (Websites and Mobile Applications) (No. 2)
              Accessibility Regulations 2018. While Accredilink Community Response Taskforce is not a public sector body,
              we voluntarily adhere to these standards because we believe in equal access to information for everyone.
            </p>
            <p>
              You can contact the Equality Advisory Support Service (EASS) if you have experienced discrimination:
            </p>
            <ul>
              <li><strong>Website:</strong>{' '}
                <a href="https://www.equalityadvisoryservice.com" target="_blank" rel="noopener noreferrer">equalityadvisoryservice.com</a>
              </li>
              <li><strong>Phone:</strong> 0808 800 0082</li>
              <li><strong>Textphone:</strong> 0808 800 0084</li>
              <li><strong>Email:</strong>{' '}
                <a href="mailto:correspondence@equalityadvisoryservice.com">correspondence@equalityadvisoryservice.com</a>
              </li>
            </ul>
            <p>
              In Wales, you can also contact the <strong>Equality and Human Rights Commission Wales</strong> office:
            </p>
            <ul>
              <li><strong>Phone:</strong> 029 2044 7710</li>
              <li><strong>Post:</strong> Equality and Human Rights Commission, Block 1, Spur D, Government Buildings, St Agnes Road, Gabalfa, Cardiff CF14 4YJ</li>
            </ul>

            <h2 className="text-2xl">8. Technical Information</h2>
            <p>
              This website is built using modern web technologies and is designed to be compatible with current assistive technologies:
            </p>
            <ul>
              <li><strong>HTML5:</strong> Semantic markup with proper heading hierarchy and landmark regions</li>
              <li><strong>CSS:</strong> Responsive design using relative units to support text resizing</li>
              <li><strong>JavaScript:</strong> Progressive enhancement approach; core content is accessible without JavaScript</li>
              <li><strong>ARIA:</strong> Accessible Rich Internet Applications attributes used where semantic HTML alone is not sufficient</li>
            </ul>

            <h3>Browser and assistive technology compatibility</h3>
            <p>This website has been designed to be compatible with the following:</p>
            <ul>
              <li>Recent versions of Chrome, Firefox, Safari, and Edge</li>
              <li>JAWS and NVDA screen readers on Windows</li>
              <li>VoiceOver on macOS and iOS</li>
              <li>TalkBack on Android</li>
              <li>Windows Magnifier and macOS Zoom</li>
              <li>Dragon NaturallySpeaking voice recognition</li>
            </ul>

            <h2 className="text-2xl">9. Our Ongoing Commitment</h2>
            <p>
              Accessibility is an ongoing effort. We are committed to the following:
            </p>
            <ul>
              <li>Conducting regular accessibility audits of the website</li>
              <li>Ensuring all new content and features meet WCAG 2.1 AA standards</li>
              <li>Training our team to create and maintain accessible content</li>
              <li>Acting promptly on accessibility feedback from users</li>
              <li>Reviewing and updating this statement annually</li>
              <li>Working towards WCAG 2.2 compliance as standards evolve</li>
            </ul>
            <p>
              We recognise that accessibility is not a one-time task but a continuous process of improvement. We are
              committed to making our website — and all of our services — as accessible and inclusive as possible for
              the communities we serve across North Wales.
            </p>

            <h2 className="text-2xl">10. Related Policies</h2>
            <p>
              For more information about how we protect your data and your rights, please see:
            </p>
            <ul>
              <li><Link href="/privacy-policy">Privacy Policy</Link> — How we handle your personal data</li>
              <li><Link href="/terms">Terms and Conditions</Link> — Terms of use for this website</li>
              <li><Link href="/cookie-policy">Cookie Policy</Link> — How we use cookies</li>
              <li><Link href="/compliance">Compliance, Safeguarding & Funding</Link> — Our regulatory compliance and standards</li>
            </ul>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Need Help Accessing Our Website?</h2>
          <p className="text-slate-600 mb-6">
            If you are having difficulty using this website or need information in an alternative format, please do not hesitate to contact us. We are here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors"
            >
              Contact Us
            </Link>
            <a
              href="tel:01824538688"
              className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-slate-300 hover:bg-white transition-colors"
            >
              Call 01824 538688
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
