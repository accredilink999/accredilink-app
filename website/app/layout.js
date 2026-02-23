import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobilePreviewToggle from "@/components/MobilePreviewToggle";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://accredilinkcare.co.uk'),
  title: {
    default: "Accredilink Community Response Taskforce | Home Care Services in Denbighshire, Conwy & Wrexham",
    template: "%s | Accredilink CRT",
  },
  description:
    "CIW-regulated domiciliary care, emergency response, respite care and palliative care services across Denbighshire, Conwy and Wrexham, North Wales. Not-for-profit care provider with qualified emergency care responders.",
  keywords: [
    "domiciliary care Denbighshire",
    "home care North Wales",
    "care services Denbighshire",
    "emergency care responders",
    "respite care at home Denbighshire",
    "palliative care Denbighshire",
    "CIW regulated care agency",
    "home care Conwy",
    "home care Wrexham",
    "domiciliary care North Wales",
    "care agency Denbigh",
    "care services Rhyl",
    "hospital discharge care Wales",
    "dementia care at home North Wales",
    "overnight care Denbighshire",
    "not for profit care provider Wales",
    "Care Inspectorate Wales",
    "CIW",
  ],
  openGraph: {
    title: "Accredilink Community Response Taskforce | Home Care in North Wales",
    description: "CIW-regulated domiciliary care, emergency response, respite and palliative care across Denbighshire, Conwy & Wrexham. Not-for-profit care provider.",
    type: "website",
    locale: "en_GB",
    url: "https://accredilinkcare.co.uk",
    siteName: "Accredilink Community Response Taskforce",
    images: [
      {
        url: "/images/hero-home.jpg",
        width: 1200,
        height: 630,
        alt: "Accredilink Community Response Taskforce - Compassionate Care in North Wales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Accredilink CRT | Home Care Services in North Wales",
    description: "CIW-regulated domiciliary care, emergency response and specialist support across Denbighshire, Conwy & Wrexham.",
    images: ["/images/hero-home.jpg"],
  },
  alternates: {
    canonical: "https://accredilinkcare.co.uk",
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: 'your-verification-code',
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://accredilinkcare.co.uk/#organization",
  name: "Accredilink Community Response Taskforce",
  url: "https://accredilinkcare.co.uk",
  logo: "https://accredilinkcare.co.uk/images/logo.png",
  description: "CIW-regulated not-for-profit domiciliary care provider serving Denbighshire, Conwy and Wrexham in North Wales.",
  telephone: "+441824538688",
  email: "enquiries@accredilinkcare.co.uk",
  address: {
    "@type": "PostalAddress",
    streetAddress: "The Hummingbird, 27-29 High St",
    addressLocality: "Denbigh",
    addressRegion: "Denbighshire",
    postalCode: "LL16 3HY",
    addressCountry: "GB",
  },
  sameAs: [
    "https://facebook.com/accredilinkcare",
    "https://instagram.com/accredilinkcare",
    "https://linkedin.com/company/accredilinkcare",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+441824538688",
      contactType: "customer service",
      areaServed: ["Denbighshire", "Conwy", "Wrexham"],
      availableLanguage: ["English", "Welsh"],
    },
    {
      "@type": "ContactPoint",
      telephone: "+441824538688",
      contactType: "emergency",
      areaServed: ["Denbighshire", "Conwy", "Wrexham"],
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
    },
  ],
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "HomeHealthCareService",
  "@id": "https://accredilinkcare.co.uk/#localbusiness",
  name: "Accredilink Community Response Taskforce",
  image: "https://accredilinkcare.co.uk/images/logo.png",
  url: "https://accredilinkcare.co.uk",
  telephone: "+441824538688",
  email: "enquiries@accredilinkcare.co.uk",
  description: "Professional domiciliary care, emergency response, respite care and palliative care services across Denbighshire, Conwy and Wrexham. CIW regulated, not-for-profit.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "The Hummingbird, 27-29 High St",
    addressLocality: "Denbigh",
    addressRegion: "Denbighshire",
    postalCode: "LL16 3HY",
    addressCountry: "GB",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 53.1847,
    longitude: -3.4153,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
  ],
  areaServed: [
    { "@type": "County", name: "Denbighshire" },
    { "@type": "County", name: "Conwy" },
    { "@type": "County", name: "Wrexham" },
  ],
  priceRange: "$$",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Care Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Domiciliary Care" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Respite Care" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Emergency Response" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Palliative Care" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Sit-in Services" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Training" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Event Medical Services" } },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <div id="preview-wrapper">
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </div>
        <MobilePreviewToggle />
      </body>
    </html>
  );
}
