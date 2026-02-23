import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Blog | Care Guides, Advice & News',
  description: 'Expert advice on domiciliary care, funding guidance, dementia support, hospital discharge, and care in Wales. From the Accredilink team.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/blog',
  },
};

const posts = [
  {
    slug: 'how-much-does-home-care-cost-wales',
    title: 'How Much Does Home Care Cost in Wales? A 2026 Guide',
    excerpt: 'A clear breakdown of domiciliary care costs in Wales — hourly rates, local authority funding, the Welsh charge cap, Attendance Allowance, and how to make care affordable.',
    category: 'Funding',
    date: '2026-02-23',
    thumbnail: '/images/funding.jpg',
  },
  {
    slug: 'care-home-vs-home-care',
    title: 'Care Home vs Home Care: What Is the Difference?',
    excerpt: 'Understanding the key differences between residential care homes and domiciliary home care — costs, independence, regulation, and how to decide which is right.',
    category: 'Guides',
    date: '2026-02-20',
    thumbnail: '/images/hero-home.jpg',
  },
  {
    slug: 'how-to-get-carers-assessment-wales',
    title: 'How to Get a Carer\'s Assessment in Wales: Your Complete Guide',
    excerpt: 'Your legal right to a carer\'s assessment in Wales — what it is, who qualifies, how to request one, and what support it can lead to.',
    category: 'Guides',
    date: '2026-02-16',
    thumbnail: '/images/hero-care.jpg',
  },
  {
    slug: 'how-to-arrange-domiciliary-care-in-wales',
    title: 'How to Arrange Domiciliary Care in Wales: A Complete Guide',
    excerpt: 'Everything you need to know about setting up home care in Wales — from assessments and funding to choosing the right provider.',
    category: 'Guides',
    date: '2026-02-10',
    thumbnail: '/images/domiciliary-care.jpg',
  },
  {
    slug: 'understanding-care-funding-in-wales',
    title: 'Understanding Care Funding in Wales: What You Need to Know',
    excerpt: 'A clear guide to local authority funding, direct payments, Attendance Allowance, and NHS Continuing Healthcare in Wales.',
    category: 'Funding',
    date: '2026-02-03',
    thumbnail: '/images/funding.jpg',
  },
  {
    slug: 'signs-elderly-parent-needs-care',
    title: '10 Signs Your Elderly Parent May Need Care at Home',
    excerpt: 'How to recognise when a loved one might benefit from professional domiciliary care — and what to do next.',
    category: 'Family Advice',
    date: '2026-01-27',
    thumbnail: '/images/hero-care.jpg',
  },
  {
    slug: 'what-is-respite-care',
    title: 'What is Respite Care and How Can It Help Your Family?',
    excerpt: 'Understanding respite care, who it\'s for, and how it can give family carers the break they need.',
    category: 'Guides',
    date: '2026-01-20',
    thumbnail: '/images/respite-care.jpg',
  },
  {
    slug: 'hospital-discharge-care-wales',
    title: 'Hospital Discharge and Home Care in Wales: What Happens Next?',
    excerpt: 'What to expect when a loved one is discharged from hospital and how domiciliary care can support a safe recovery at home.',
    category: 'Guides',
    date: '2026-01-13',
    thumbnail: '/images/hero-home.jpg',
  },
  {
    slug: 'dementia-care-at-home-tips',
    title: 'Caring for Someone with Dementia at Home: Practical Tips',
    excerpt: 'Practical advice for families supporting a loved one with dementia, including daily routines, communication tips, and when to seek professional help.',
    category: 'Dementia',
    date: '2026-01-06',
    thumbnail: '/images/palliative-care.jpg',
  },
  {
    slug: 'home-care-denbighshire-guide',
    title: 'Home Care in Denbighshire: Your Complete Guide to Local Care Services',
    excerpt: 'Everything you need to know about arranging home care in Denbighshire — from choosing a provider to understanding local authority support.',
    category: 'Local Guides',
    date: '2025-12-30',
    thumbnail: '/images/hero-home.jpg',
  },
];

export default function BlogPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/blog-header.jpg" alt="Care blog header" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80" />
        </div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Blog</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Guides, advice, and news about care services in Wales from the Accredilink team.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {posts.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="flex flex-col sm:flex-row gap-0 sm:gap-0 rounded-2xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-lg transition-all group bg-white overflow-hidden"
              >
                <div className="relative w-full sm:w-48 md:w-56 h-48 sm:h-auto flex-shrink-0">
                  <Image
                    src={post.thumbnail}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2.5 py-1 bg-red-50 text-welsh-red text-xs font-medium rounded-full">{post.category}</span>
                    <span className="text-xs text-slate-400">{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 group-hover:text-welsh-red transition-colors mb-2">
                    {post.title}
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-welsh-red">
                    Read more
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
