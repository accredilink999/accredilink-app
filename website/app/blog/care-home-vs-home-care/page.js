import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Care Home vs Home Care: What Is the Difference?',
  description: 'Care home vs home care in Wales — compare costs, benefits, and regulation. Find the right option for your family in Denbighshire, Conwy & Wrexham.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/blog/care-home-vs-home-care',
  },
};

export default function CareHomeVsHomeCare() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Care Home vs Home Care: What Is the Difference?",
        description: "Understanding the difference between care homes and home care (domiciliary care) in Wales. Compare costs, benefits, regulation, and find out which option is right for your family in Denbighshire, Conwy, and Wrexham.",
        author: { "@type": "Organization", "@id": "https://accredilinkcare.co.uk/#organization", name: "Accredilink Community Response Taskforce" },
        publisher: { "@type": "Organization", "@id": "https://accredilinkcare.co.uk/#organization" },
        url: "https://accredilinkcare.co.uk/blog/care-home-vs-home-care",
        mainEntityOfPage: "https://accredilinkcare.co.uk/blog/care-home-vs-home-care",
      }) }} />
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#B91C1C] via-white to-[#166534]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Articles
          </Link>
          <span className="inline-block px-2.5 py-1 bg-white/10 text-white/80 text-xs font-medium rounded-full mb-4">Guides</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">Care Home vs Home Care: What Is the Difference?</h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 mb-8">
        <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-lg">
          <Image src="/images/hero-home.jpg" alt="Comparing care homes and home care in Wales" fill className="object-cover" />
        </div>
      </div>

      <article className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate prose-lg">
          <p>
            A <strong>care home</strong> is a residential facility where a person moves in and receives 24-hour care from on-site staff, while <strong>home care</strong> (also called domiciliary care) is a service where professional carers visit a person in their own home to provide support at agreed times. The main difference is where the care happens: in a care home, you move out of your house; with home care, you stay put. Both are regulated by Care Inspectorate Wales (CIW), and the right choice depends on a person&rsquo;s care needs, personal preferences, and family circumstances.
          </p>
          <p>
            If you&rsquo;re trying to work out which option is best for a parent, spouse, or other family member, you&rsquo;re not alone. It&rsquo;s one of the most common questions families in Wales ask when care needs start to grow. This guide breaks down the key differences, costs, and things to consider so you can make an informed decision.
          </p>

          <h2>What Is a Care Home?</h2>
          <p>
            A care home is a building &mdash; sometimes called a residential home &mdash; where a number of people live together and receive care from staff who are on site around the clock. The person moves out of their own home and into a room (usually a private bedroom with an en-suite) within the care home.
          </p>
          <p>
            Care homes provide meals, help with personal care such as washing and dressing, medication management, and social activities. Staff are available 24 hours a day, 7 days a week, so there is always someone on hand if help is needed during the night or in an emergency.
          </p>
          <p>
            Some care homes also offer <strong>nursing care</strong>, where registered nurses are on site to provide medical support. These are sometimes called nursing homes. A standard residential care home does not have nursing staff &mdash; the distinction matters if your loved one has complex medical needs.
          </p>

          <h2>What Is Home Care (Domiciliary Care)?</h2>
          <p>
            Home care &mdash; officially known as <Link href="/services/domiciliary-care">domiciliary care</Link> &mdash; is when a professional carer comes to a person&rsquo;s own home to provide support. Visits can range from 30 minutes to several hours, and can happen once a day, multiple times a day, or even overnight depending on what&rsquo;s needed.
          </p>
          <p>
            The person stays in their own house, sleeps in their own bed, and keeps their usual routines and surroundings. A care worker visits at agreed times to help with things like getting up, personal hygiene, meals, medication, light housework, or simply spending time together and providing companionship.
          </p>
          <p>
            Home care is flexible. You can start with just a few visits a week and increase them as needs change. For people who need support throughout the day and night, <strong>live-in care</strong> is also an option &mdash; where a carer stays in the person&rsquo;s home full-time.
          </p>

          <h2>Key Differences at a Glance</h2>
          <p>
            Here is a straightforward comparison of the two options:
          </p>
          <div className="overflow-x-auto not-prose my-8">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-900 border-b border-slate-200"></th>
                  <th className="text-left p-3 font-semibold text-slate-900 border-b border-slate-200">Care Home</th>
                  <th className="text-left p-3 font-semibold text-slate-900 border-b border-slate-200">Home Care</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-3 font-medium text-slate-700">Where</td>
                  <td className="p-3 text-slate-600">Move into a residential facility</td>
                  <td className="p-3 text-slate-600">Stay in your own home</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="p-3 font-medium text-slate-700">Staffing</td>
                  <td className="p-3 text-slate-600">24/7 on-site staff</td>
                  <td className="p-3 text-slate-600">Carers visit at scheduled times</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-3 font-medium text-slate-700">Independence</td>
                  <td className="p-3 text-slate-600">Less personal autonomy; shared routines</td>
                  <td className="p-3 text-slate-600">Maximum independence; your own routines</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="p-3 font-medium text-slate-700">Social life</td>
                  <td className="p-3 text-slate-600">Built-in community of other residents</td>
                  <td className="p-3 text-slate-600">Familiar neighbours, friends, and community</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-3 font-medium text-slate-700">Personalisation</td>
                  <td className="p-3 text-slate-600">Shared mealtimes, activities, and spaces</td>
                  <td className="p-3 text-slate-600">Fully personalised; one-to-one care</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="p-3 font-medium text-slate-700">Pets</td>
                  <td className="p-3 text-slate-600">Usually not allowed</td>
                  <td className="p-3 text-slate-600">Keep your pets at home</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">Flexibility</td>
                  <td className="p-3 text-slate-600">Long-term commitment; hard to trial</td>
                  <td className="p-3 text-slate-600">Scale up or down as needs change</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>How Do the Costs Compare?</h2>
          <p>
            Cost is often one of the biggest factors in the decision. Here&rsquo;s a realistic picture of what each option typically costs in Wales:
          </p>
          <ul>
            <li><strong>Care home fees:</strong> The average cost of a residential care home in Wales is around <strong>&pound;800 to &pound;1,200 per week</strong>, depending on the area and the level of care. Nursing homes with on-site medical staff are typically at the higher end or above this range. That works out to roughly &pound;3,500 to &pound;5,200 per month.</li>
            <li><strong>Home care costs:</strong> Domiciliary care in Wales typically costs between <strong>&pound;28 and &pound;35 per hour</strong>. If someone needs, say, three one-hour visits a day, that comes to around &pound;588 to &pound;735 per week. For lower levels of support &mdash; perhaps one visit a day &mdash; the weekly cost could be as little as &pound;196 to &pound;245.</li>
          </ul>
          <p>
            For many families, home care works out significantly cheaper than a care home, especially when the person doesn&rsquo;t need round-the-clock supervision. However, if someone needs care throughout the day and night, the costs can be comparable or even higher for home care.
          </p>

          <h3>The Welsh Government Cap on Non-Residential Care Charges</h3>
          <p>
            Here&rsquo;s something important that many families don&rsquo;t know about: the Welsh Government sets a <strong>maximum weekly charge of &pound;100 for non-residential care services</strong>, including domiciliary care. This cap applies to care arranged through your local authority after a care needs assessment. It means that even if you receive several hours of home care per day, you won&rsquo;t pay more than &pound;100 per week in charges &mdash; a significant saving compared to care home fees, which are not subject to the same cap.
          </p>
          <p>
            This &pound;100 weekly cap is a major financial advantage of home care for people who qualify for local authority support. It&rsquo;s unique to Wales and is one of the most generous care charging policies in the UK. You can find out more in our <Link href="/blog/how-to-arrange-domiciliary-care-in-wales">guide to arranging domiciliary care in Wales</Link>.
          </p>

          <h2>When Might a Care Home Be the Better Option?</h2>
          <p>
            Care homes are a good fit in certain situations. A care home might be more appropriate if:
          </p>
          <ul>
            <li><strong>Very high care needs:</strong> The person needs help throughout the day and night, including overnight supervision or regular night-time interventions.</li>
            <li><strong>Safety concerns:</strong> The person has advanced dementia or a condition that means they are at risk of falls, wandering, or harm when alone, and it is no longer safe for them to be unsupervised at any time.</li>
            <li><strong>Isolation and loneliness:</strong> The person lives alone and has become very isolated. A care home provides built-in company, social activities, and a sense of community that can be hard to replicate at home.</li>
            <li><strong>Carer burnout:</strong> The family carer is no longer able to continue, and the level of care needed is too high for visiting home care alone to cover safely.</li>
            <li><strong>The home environment is unsuitable:</strong> The property cannot be adapted for the person&rsquo;s mobility or care needs &mdash; for example, if they need a wheelchair but live in a house with steep stairs and no room for a stairlift.</li>
          </ul>

          <h2>When Is Home Care the Better Option?</h2>
          <p>
            For many people, staying at home is the preferred choice &mdash; and it&rsquo;s often achievable even when care needs are significant. Home care is usually the better option when:
          </p>
          <ul>
            <li><strong>The person wants to stay at home:</strong> Most people, when asked, say they would rather remain in their own home. Their comfort, dignity, and preferences should be at the centre of the decision.</li>
            <li><strong>Maintaining independence matters:</strong> Home care supports the person to keep doing what they can for themselves, rather than having everything done for them.</li>
            <li><strong>Family and community are nearby:</strong> If relatives, friends, and neighbours are close by and involved, home care fits naturally alongside that existing support network.</li>
            <li><strong>Familiar surroundings help:</strong> For people with early to moderate dementia, staying in a familiar environment with known routines can reduce confusion and anxiety significantly. You can read more about this in our article on <Link href="/blog/signs-elderly-parent-needs-care">recognising when a parent needs more support</Link>.</li>
            <li><strong>Care needs are moderate:</strong> If the person needs help at specific times of day but is safe between visits, home care is a practical and cost-effective solution.</li>
            <li><strong>They have pets:</strong> Pets are a huge part of many people&rsquo;s lives. Home care means they don&rsquo;t have to give up a beloved cat or dog.</li>
            <li><strong>Financial considerations:</strong> With the Welsh Government&rsquo;s &pound;100 weekly cap on non-residential care charges, home care arranged through the local authority can be substantially more affordable than a care home.</li>
          </ul>

          <h2>Can You Switch Between Care Home and Home Care?</h2>
          <p>
            Yes, absolutely. The choice isn&rsquo;t permanent, and many families find that needs change over time. It&rsquo;s quite common for someone to start with home care and then move into a care home later if their needs increase beyond what can be safely managed at home. Equally, some people move back home from a care home if their health improves or if the right home care package is put in place.
          </p>
          <p>
            Some families also use a combination &mdash; for example, home care as the main arrangement with occasional <Link href="/services/respite-care">respite care</Link> in a residential setting to give the family carer a break. The key is that the care arrangement should always be reviewed and adjusted as things change.
          </p>

          <h2>How Is the Decision Made?</h2>
          <p>
            The decision about care home vs home care usually involves several things coming together:
          </p>
          <ul>
            <li><strong>Care needs assessment:</strong> Your local authority can carry out a free assessment of the person&rsquo;s care and support needs. This helps identify what level of care is required and what options are available. In Denbighshire, Conwy, and Wrexham, you can request this through the local Single Point of Access.</li>
            <li><strong>Personal preference:</strong> What does the person themselves want? Their voice should be central to the decision. Under the Social Services and Well-being (Wales) Act 2014, the person&rsquo;s wishes and feelings must be taken into account.</li>
            <li><strong>Family input:</strong> Family members often play a big role in supporting the decision, especially if they are providing informal care alongside professional services.</li>
            <li><strong>Professional advice:</strong> GPs, district nurses, occupational therapists, and social workers can all offer valuable guidance on what&rsquo;s safe and appropriate.</li>
            <li><strong>Financial assessment:</strong> The local authority will carry out a financial assessment to determine how much the person needs to contribute towards the cost of their care, whether that&rsquo;s in a care home or at home.</li>
          </ul>

          <h2>Regulation in Wales</h2>
          <p>
            Both care homes and home care agencies in Wales are regulated by <strong>Care Inspectorate Wales (CIW)</strong> under the Regulation and Inspection of Social Care (Wales) Act 2016. This means both types of service must meet the same standards for quality, safety, and staffing. CIW carries out regular inspections and publishes reports that you can read online before choosing a provider.
          </p>
          <p>
            When comparing providers, always check that they are CIW-registered. This applies equally to care homes and domiciliary care agencies. Registration means the service has been assessed and meets the legal requirements to operate in Wales.
          </p>

          <h2>How Accredilink Can Help</h2>
          <p>
            At Accredilink, we&rsquo;re a CIW-registered <Link href="/services/domiciliary-care">domiciliary care provider</Link> serving families across Denbighshire, Conwy, and Wrexham. We believe that most people are happiest and healthiest when they can stay in their own home, and our job is to make that possible for as long as it&rsquo;s safe and practical.
          </p>
          <p>
            We offer a free, no-obligation initial assessment to understand what your loved one needs and to talk through the options with you. Whether it&rsquo;s a few visits a week to help with personal care and meals, or a more comprehensive package with daily support, we&rsquo;ll build a care plan that fits.
          </p>
          <p>
            If you&rsquo;re weighing up care home vs home care for someone you love, we&rsquo;re happy to have an honest conversation about what&rsquo;s realistic and what might work best. There&rsquo;s no pressure and no sales pitch &mdash; just straightforward guidance from people who understand care in Wales.
          </p>
        </div>
      </article>

      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Not Sure Which Option Is Right?</h2>
          <p className="text-slate-600 mb-6">If you&rsquo;re exploring care options for a loved one in Denbighshire, Conwy, or Wrexham, we&rsquo;re here to help. Get in touch for a free, no-obligation chat about what home care could look like for your family.</p>
          <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-[#B91C1C] text-white font-semibold rounded-xl hover:bg-[#DC2626] transition-colors">Get in Touch</Link>
        </div>
      </section>
    </>
  );
}
