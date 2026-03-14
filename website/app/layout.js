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
    default: "Home Care Denbighshire, Conwy & Wrexham | Accredilink CRT",
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
    type: "website",
    locale: "en_GB",
    siteName: "Accredilink Community Response Taskforce",
  },
  twitter: {
    card: "summary_large_image",
    site: "@AccredilinkCare",
    creator: "@AccredilinkCare",
  },
  alternates: {
    languages: {
      "en-GB": "https://accredilinkcare.co.uk",
    },
  },
  verification: {
    google: 'google3b98beac371438cf',
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
    "https://www.facebook.com/profile.php?id=61585016304011",
    "https://www.instagram.com/accredicare999",
    "https://www.linkedin.com/company/accredilink",
    "https://x.com/AccredilinkCare",
    "https://uk.trustpilot.com/review/accredilinkcare.co.uk",
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
    <html lang="en-GB">
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
