import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy',
  description: 'Cookie policy for the Accredilink Community Response Taskforce website. What cookies we use, why we use them, and how to manage your cookie preferences.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/cookie-policy',
  },
};

export default function CookiePolicyPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(185,28,28,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Cookie Policy</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            This policy explains what cookies are, how we use them on our website, and how you can manage your preferences.
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
                <strong className="text-slate-900">Cymraeg:</strong> Mae&apos;r polisi hwn ar gael yn Gymraeg ar gais.
                This policy is available in Welsh on request. Please email{' '}
                <a href="mailto:enquiries@accredilinkcare.co.uk" className="text-welsh-red font-medium hover:underline">enquiries@accredilinkcare.co.uk</a>.
              </p>
            </div>

            <h2 className="text-2xl mt-0">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your computer, phone, or tablet when you visit a website.
              They are widely used to make websites work efficiently, to remember your preferences, and to provide
              information to the website owners about how the site is being used.
            </p>
            <p>
              Cookies are not harmful. They cannot contain viruses, cannot access other information on your device,
              and cannot be used to identify you personally on their own. However, some cookies can be used to track
              your browsing behaviour across websites, which is why regulations require us to be transparent about how we use them.
            </p>
            <p>
              This Cookie Policy applies to the website operated by Accredilink Community Response Taskforce at{' '}
              <a href="https://accredilinkcare.co.uk">accredilinkcare.co.uk</a>.
            </p>

            <h2 className="text-2xl">2. How We Use Cookies</h2>
            <p>
              We use cookies to ensure our website functions correctly, to improve your browsing experience, and to
              understand how visitors use our site so we can make improvements. We categorise the cookies we use into
              the following types:
            </p>

            <h3>Essential cookies (strictly necessary)</h3>
            <p>
              These cookies are required for the website to function properly. Without them, certain features of the
              website would not work. Essential cookies do not require your consent under UK privacy regulations, but
              we list them here for transparency.
            </p>

            <div className="not-prose my-6 overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-3 font-semibold text-slate-900 border-b border-slate-200">Cookie</th>
                    <th className="text-left p-3 font-semibold text-slate-900 border-b border-slate-200">Purpose</th>
                    <th className="text-left p-3 font-semibold text-slate-900 border-b border-slate-200">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  <tr className="border-b border-slate-100">
                    <td className="p-3 font-mono text-xs">__next_*</td>
                    <td className="p-3">Framework cookies required for page loading and routing</td>
                    <td className="p-3">Session</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-3 font-mono text-xs">cookie_consent</td>
                    <td className="p-3">Remembers your cookie consent preferences</td>
                    <td className="p-3">1 year</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs">csrf_token</td>
                    <td className="p-3">Security token to prevent cross-site request forgery on forms</td>
                    <td className="p-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>Analytics cookies (performance)</h3>
            <p>
              Analytics cookies help us understand how visitors interact with our website. They collect information about
              which pages are visited most often, how long visitors spend on each page, and whether visitors encounter
              any error messages. This information is aggregated and anonymised, meaning it cannot identify you personally.
            </p>
            <p>
              We use this data to improve our website and ensure we are providing the information that people need.
              Analytics cookies are only set with your consent.
            </p>

            <div className="not-prose my-6 overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-3 font-semibold text-slate-900 border-b border-slate-200">Cookie</th>
                    <th className="text-left p-3 font-semibold text-slate-900 border-b border-slate-200">Purpose</th>
                    <th className="text-left p-3 font-semibold text-slate-900 border-b border-slate-200">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  <tr className="border-b border-slate-100">
                    <td className="p-3 font-mono text-xs">_ga</td>
                    <td className="p-3">Google Analytics — distinguishes unique visitors by assigning a randomly generated number</td>
                    <td className="p-3">2 years</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-3 font-mono text-xs">_ga_*</td>
                    <td className="p-3">Google Analytics 4 — used to maintain session state</td>
                    <td className="p-3">2 years</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs">_gid</td>
                    <td className="p-3">Google Analytics — distinguishes users for aggregate analytics</td>
                    <td className="p-3">24 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="not-prose my-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-slate-700">
                <strong className="text-slate-900">Note:</strong> Google Analytics cookies are not currently active on
                this website. We may implement Google Analytics in the future to help us improve our services. If and when
                we do, we will update this policy and ensure analytics cookies are only set with your explicit consent.
              </p>
            </div>

            <h3>Functional cookies</h3>
            <p>
              Functional cookies enable the website to provide enhanced functionality and personalisation. They may be
              set by us or by third-party providers whose services we have added to our pages. If you do not allow these
              cookies, some or all of these features may not function properly.
            </p>

            <div className="not-prose my-6 overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-3 font-semibold text-slate-900 border-b border-slate-200">Cookie</th>
                    <th className="text-left p-3 font-semibold text-slate-900 border-b border-slate-200">Purpose</th>
                    <th className="text-left p-3 font-semibold text-slate-900 border-b border-slate-200">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  <tr>
                    <td className="p-3 font-mono text-xs">theme_preference</td>
                    <td className="p-3">Remembers if you have selected a display preference (e.g. high contrast)</td>
                    <td className="p-3">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl">3. Third-Party Cookies</h2>
            <p>
              Some cookies on our website may be set by third-party services that we use. We do not control these cookies
              and their use is governed by the privacy policies of those third parties. Third-party services that may set
              cookies on our website include:
            </p>
            <ul>
              <li>
                <strong>Google Analytics:</strong> If implemented, Google Analytics will use cookies to collect anonymous
                usage statistics. You can learn more about Google&apos;s data practices at{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
                You can opt out of Google Analytics tracking across all websites by installing the{' '}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.
              </li>
              <li>
                <strong>Embedded maps:</strong> If we embed Google Maps or similar mapping services to show our location
                or coverage areas, these services may set their own cookies. We aim to use privacy-enhanced modes where
                available.
              </li>
              <li>
                <strong>Social media:</strong> If we include social media sharing buttons or embeds, these platforms may
                set cookies when you interact with them. This includes platforms such as Facebook and Instagram.
              </li>
            </ul>
            <p>
              We regularly review the third-party services we use and aim to minimise the number of third-party cookies
              set on our website.
            </p>

            <h2 className="text-2xl">4. How to Manage Cookies</h2>
            <p>
              You have several options for managing cookies:
            </p>

            <h3>Browser settings</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. You can usually find these in the
              &quot;Settings&quot;, &quot;Preferences&quot;, or &quot;Privacy&quot; section of your browser. You can:
            </p>
            <ul>
              <li>View what cookies are currently stored on your device</li>
              <li>Delete all cookies or specific cookies</li>
              <li>Block all cookies or cookies from specific websites</li>
              <li>Set your browser to notify you when a cookie is being set</li>
              <li>Set your browser to refuse third-party cookies while allowing first-party cookies</li>
            </ul>

            <p>Here is how to manage cookies in the most common browsers:</p>

            <div className="not-prose my-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647' },
                { name: 'Mozilla Firefox', url: 'https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer' },
                { name: 'Apple Safari', url: 'https://support.apple.com/en-gb/guide/safari/sfri11471/mac' },
                { name: 'Microsoft Edge', url: 'https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09' },
              ].map((browser) => (
                <a
                  key={browser.name}
                  href={browser.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-welsh-red/30 transition-colors group"
                >
                  <span className="text-sm font-medium text-slate-900 group-hover:text-welsh-red transition-colors">{browser.name}</span>
                  <svg className="w-4 h-4 text-slate-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>

            <h3>On mobile devices</h3>
            <p>
              If you are using a mobile device, you can manage cookies through your device settings:
            </p>
            <ul>
              <li><strong>iOS (iPhone/iPad):</strong> Go to Settings &gt; Safari &gt; Privacy &amp; Security to manage cookie preferences</li>
              <li><strong>Android:</strong> Open Chrome, tap the three-dot menu &gt; Settings &gt; Privacy and Security &gt; Cookies</li>
            </ul>

            <h3>Impact of blocking cookies</h3>
            <p>
              Please be aware that if you choose to block or delete cookies, some features of our website may not work
              properly. Essential cookies are necessary for the basic functionality of the site, and blocking them may
              prevent you from using certain features such as contact forms.
            </p>

            <h2 className="text-2xl">5. Do Not Track</h2>
            <p>
              Some browsers include a &quot;Do Not Track&quot; (DNT) feature that signals to websites that you do not wish to be
              tracked. There is currently no industry standard for how websites should respond to DNT signals, but we
              respect your privacy preferences and aim to minimise tracking on our website regardless of DNT settings.
            </p>

            <h2 className="text-2xl">6. Consent</h2>
            <p>
              In accordance with UK privacy regulations (the Privacy and Electronic Communications Regulations 2003, as
              amended, and the UK GDPR), we:
            </p>
            <ul>
              <li>Do not require consent for strictly necessary (essential) cookies, as they are needed for the website to function</li>
              <li>Will ask for your explicit consent before setting any analytics, functional, or third-party cookies</li>
              <li>Will make it easy for you to change or withdraw your consent at any time</li>
              <li>Will not set non-essential cookies until you have given your consent</li>
            </ul>

            <h2 className="text-2xl">7. Changes to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in the cookies we use, changes in
              technology, or changes in the law. The latest version will always be available on this page with the date
              of the last update shown at the top.
            </p>
            <p>
              We recommend checking this page periodically to stay informed about how we use cookies. If we make
              significant changes, we will notify you through a prominent notice on the website.
            </p>

            <h2 className="text-2xl">8. More Information About Cookies</h2>
            <p>
              If you would like to learn more about cookies in general, you can visit the following resources:
            </p>
            <ul>
              <li>
                <a href="https://ico.org.uk/for-the-public/online/cookies/" target="_blank" rel="noopener noreferrer">
                  Information Commissioner&apos;s Office — Cookies guidance
                </a>
              </li>
              <li>
                <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">
                  All About Cookies
                </a>
              </li>
              <li>
                <a href="https://www.youronlinechoices.com/uk/" target="_blank" rel="noopener noreferrer">
                  Your Online Choices — A guide to online behavioural advertising
                </a>
              </li>
            </ul>

            <h2 className="text-2xl">9. Contact Us</h2>
            <p>
              If you have any questions about this Cookie Policy or how we use cookies, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong>{' '}
                <a href="mailto:enquiries@accredilinkcare.co.uk">enquiries@accredilinkcare.co.uk</a></li>
              <li><strong>Phone:</strong> 01824 538688</li>
              <li><strong>Post:</strong> Accredilink Community Response Taskforce, The Hummingbird, 27-29 High St, Denbigh LL16 3HY</li>
            </ul>
            <p>
              You can also visit our{' '}
              <Link href="/contact">contact page</Link>{' '}
              to get in touch. For more information about how we handle your personal data, please see our{' '}
              <Link href="/privacy-policy">Privacy Policy</Link>.
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
            <Link href="/terms" className="p-5 bg-white rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-sm transition-all text-center group">
              <p className="font-semibold text-slate-900 group-hover:text-welsh-red transition-colors">Terms &amp; Conditions</p>
              <p className="text-sm text-slate-500 mt-1">Website terms of use</p>
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
