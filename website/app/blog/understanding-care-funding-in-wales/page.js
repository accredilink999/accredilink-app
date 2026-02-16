import Link from 'next/link';

export const metadata = {
  title: 'Understanding Care Funding in Wales: What You Need to Know | Accredilink',
  description: 'A clear guide to care funding in Wales, including local authority funding, financial assessments, direct payments, NHS Continuing Healthcare, Attendance Allowance, and the Welsh cap on care charges.',
};

export default function UnderstandingCareFundingInWales() {
  return (
    <>
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#B91C1C] via-white to-[#166534]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Articles
          </Link>
          <span className="inline-block px-2.5 py-1 bg-white/10 text-white/80 text-xs font-medium rounded-full mb-4">Funding</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">Understanding Care Funding in Wales: What You Need to Know</h1>
        </div>
      </section>

      <article className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate prose-lg">
          <p>
            One of the most common questions families ask when they begin thinking about care is: <em>&ldquo;How do we pay for it?&rdquo;</em> It is a fair question, and the answer in Wales is more favourable than many people realise. Wales has its own distinct funding framework for social care, with a cap on weekly charges that makes domiciliary care more affordable than in many other parts of the UK.
          </p>
          <p>
            This guide explains the main routes for funding care at home in Wales, including local authority funding, direct payments, NHS Continuing Healthcare, Attendance Allowance, and what happens if you choose to self-fund. Whether you live in Denbighshire, Conwy, Wrexham, or elsewhere in Wales, the principles are the same &mdash; though your local authority will handle the process.
          </p>

          <h2>Local Authority Funded Care</h2>
          <p>
            The most common route to funded domiciliary care is through your local authority. Under the <strong>Social Services and Well-being (Wales) Act 2014</strong>, councils have a duty to assess anyone who appears to have care and support needs and to arrange services for those who are eligible.
          </p>
          <p>
            The process begins with a <strong>care needs assessment</strong>, which is free and does not commit you to anything. If the assessment determines that your loved one has eligible needs, the council will then carry out a <strong>financial assessment</strong> (also called a means test) to determine how much, if anything, the person should contribute towards the cost of their care.
          </p>

          <h3>The Financial Assessment</h3>
          <p>
            During the financial assessment, the local authority will look at the person&rsquo;s income and savings. Some key points to understand:
          </p>
          <ul>
            <li>If savings and capital are below a certain threshold, the person will usually qualify for fully funded or heavily subsidised care.</li>
            <li>Certain income, such as Disability Living Allowance (DLA) mobility component, is disregarded in the calculation.</li>
            <li>The value of the person&rsquo;s home is <strong>not</strong> included in the financial assessment for non-residential care (that is, domiciliary care).</li>
            <li>If the person has a partner, only the individual&rsquo;s finances are assessed, not the household&rsquo;s.</li>
          </ul>

          <h2>The Welsh Cap on Care Charges</h2>
          <p>
            One of the most significant differences between care funding in Wales and England is the <strong>weekly cap on non-residential care charges</strong>. The Welsh Government sets a maximum amount that any local authority can charge for domiciliary care per week. This cap is reviewed annually and has been in place since 2011.
          </p>
          <p>
            What this means in practice is that even if the actual cost of your care is several hundred pounds per week, the most you will ever be asked to pay is the capped amount. The local authority covers the difference. This makes Wales one of the most affordable places in the UK to receive care at home.
          </p>
          <p>
            The cap applies to all non-residential social care services, including <Link href="/services/domiciliary-care">domiciliary care</Link>, <Link href="/services/sit-in-services">sit-in services</Link>, and day care. It does not apply to residential or nursing home fees, which are assessed differently.
          </p>

          <h2>Direct Payments</h2>
          <p>
            If your loved one is assessed as having eligible care needs, they may be offered <strong>direct payments</strong> instead of (or alongside) services arranged by the local authority. Direct payments put the money directly into the person&rsquo;s hands, giving them the freedom to choose their own care provider and arrange their support in the way that suits them best.
          </p>
          <p>
            Direct payments can be used to:
          </p>
          <ul>
            <li>Employ a personal assistant (PA) directly</li>
            <li>Pay a CIW-registered care agency such as Accredilink</li>
            <li>Purchase other services that meet the person&rsquo;s assessed needs</li>
          </ul>
          <p>
            There is some administration involved in managing direct payments &mdash; you will need to keep records of how the money is spent &mdash; but many local authorities offer support with this, and there are payroll services specifically designed for direct payment recipients.
          </p>
          <p>
            Direct payments give families real choice and control. If you value being able to choose exactly who provides the care and when, this is an option worth exploring with your local authority.
          </p>

          <h2>NHS Continuing Healthcare (CHC)</h2>
          <p>
            <strong>NHS Continuing Healthcare</strong> is a package of care that is fully funded by the NHS for people who have a &ldquo;primary health need&rdquo;. This is not the same as having a health condition &mdash; it specifically means that the person&rsquo;s main care need is health-related rather than social in nature.
          </p>
          <p>
            CHC is assessed through a multi-disciplinary team process and involves completing a Decision Support Tool (DST) that evaluates needs across a range of domains, including cognition, behaviour, mobility, breathing, and skin integrity. If a person is found to be eligible, all of their care &mdash; including domiciliary care &mdash; is funded entirely by the NHS at no cost to the individual.
          </p>
          <p>
            CHC eligibility is not means-tested. It does not matter how much money or savings a person has. If their needs are primarily health-related, they may qualify. Common conditions that can lead to CHC eligibility include advanced dementia, severe neurological conditions, and complex nursing needs.
          </p>
          <p>
            The process can be lengthy and, frankly, it can be difficult to navigate. If you believe your loved one may be eligible, it is worth requesting an assessment through their GP, hospital consultant, or community nurse. You can also ask Accredilink for informal advice &mdash; we have experience supporting families through the CHC process.
          </p>

          <h2>Attendance Allowance</h2>
          <p>
            <strong>Attendance Allowance</strong> is a non-means-tested benefit from the Department for Work and Pensions (DWP) for people aged 65 or over who have a physical or mental disability that means they need help with personal care or supervision. It is paid at two rates:
          </p>
          <ul>
            <li><strong>Lower rate:</strong> for people who need help during the day or night</li>
            <li><strong>Higher rate:</strong> for people who need help both during the day and at night, or who are terminally ill</li>
          </ul>
          <p>
            Attendance Allowance is not affected by savings or income, and it is tax-free. It can be spent on whatever the person chooses &mdash; it does not have to be spent on care, though many people use it to contribute towards the cost of their <Link href="/services/domiciliary-care">domiciliary care</Link>.
          </p>
          <p>
            Importantly, receiving Attendance Allowance can also increase entitlement to other benefits, such as Pension Credit and Council Tax Reduction. It is always worth claiming, even if the person already receives local authority funded care.
          </p>
          <p>
            The application form (AA1) can be lengthy, but organisations such as Age Cymru and Citizens Advice can help with completing it. If your loved one is terminally ill, there is a fast-track &ldquo;special rules&rdquo; process that can speed up the claim significantly.
          </p>

          <h2>Self-Funding Care</h2>
          <p>
            Some families choose to arrange and pay for domiciliary care privately, without going through the local authority. This is sometimes called self-funding. Reasons for self-funding include:
          </p>
          <ul>
            <li>Wanting to arrange care quickly without waiting for an assessment</li>
            <li>Preferring to have full control over the choice of provider and the care schedule</li>
            <li>Not qualifying for local authority funding because savings are above the threshold</li>
            <li>Wanting additional hours or services beyond what the local authority would fund</li>
          </ul>
          <p>
            If you are self-funding, it is still important to choose a provider that is registered with <strong>Care Inspectorate Wales (CIW)</strong>. Registration means the provider is regularly inspected and must meet national standards for quality and safety.
          </p>
          <p>
            Even if you are self-funding now, circumstances can change. If savings fall below the local authority threshold, you can request an assessment at any time. It is also worth claiming Attendance Allowance regardless, as it is not means-tested and can help offset costs.
          </p>

          <h2>Carer&rsquo;s Allowance and Support for Family Carers</h2>
          <p>
            If you are a family member providing regular, substantial care, you may be entitled to <strong>Carer&rsquo;s Allowance</strong>. To qualify, you generally need to be caring for someone for at least 35 hours per week, and the person you care for must be receiving certain disability benefits.
          </p>
          <p>
            Beyond financial support, family carers in Wales are entitled to a <strong>carer&rsquo;s assessment</strong> in their own right. This can lead to support services such as <Link href="/services/respite-care">respite care</Link>, which gives you a break while ensuring your loved one continues to receive quality support. Read our article on <Link href="/blog/what-is-respite-care">what respite care is and how it can help</Link> for more detail.
          </p>

          <h2>Getting the Right Advice</h2>
          <p>
            Navigating care funding can feel complex, but you do not have to do it alone. Here are some sources of free, impartial advice:
          </p>
          <ul>
            <li><strong>Age Cymru</strong> &mdash; offers a free advice line and can help with benefit claims and care funding queries</li>
            <li><strong>Citizens Advice</strong> &mdash; available locally in Denbighshire, Conwy, and Wrexham</li>
            <li><strong>Dewis Cymru</strong> &mdash; the Welsh directory of well-being services and information</li>
            <li><strong>Your local authority</strong> &mdash; the Single Point of Access or Adult Social Care team can explain the process and your options</li>
          </ul>
          <p>
            At Accredilink, we are always happy to have an informal conversation about funding. While we cannot provide formal financial advice, we have helped many families understand their options and we can point you towards the right resources. Visit our <Link href="/funding-guidance">funding guidance page</Link> for an overview, or <Link href="/contact">get in touch</Link> to speak to one of our team.
          </p>
        </div>
      </article>

      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Need Help Understanding Your Funding Options?</h2>
          <p className="text-slate-600 mb-6">Our team can help you understand what funding may be available and guide you through the process. No obligation, just honest advice.</p>
          <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-[#B91C1C] text-white font-semibold rounded-xl hover:bg-[#DC2626] transition-colors">Get in Touch</Link>
        </div>
      </section>
    </>
  );
}
