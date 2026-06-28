import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveChat from "@/components/LiveChat";
import WhatsAppButton from "@/components/WhatsAppButton";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  metadataBase: new URL("https://www.carecallai.co.uk"),
  title: {
    default: "CareCallAI — Home Care Management Software UK",
    template: "%s | CareCallAI",
  },
  description:
    "All-in-one home care management software for UK domiciliary care agencies. Staff scheduling, care logging, MAR charts, compliance tracking, mobile app. CIW & CQC compliant.",
  keywords: [
    "home care software UK",
    "care management software",
    "domiciliary care software",
    "care rostering software",
    "CIW compliant care software",
    "CQC compliant care software",
    "home care scheduling app",
    "electronic MAR chart software",
    "care staff rota software",
  ],
  authors: [{ name: "CareCallAI" }],
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "CareCallAI",
    title: "CareCallAI — Home Care Management Software UK",
    description:
      "All-in-one home care management software for UK domiciliary care agencies.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@CareCallAI",
    creator: "@CareCallAI",
    title: "CareCallAI — Home Care Management Software UK",
    description:
      "All-in-one home care management software for UK domiciliary care agencies.",
    images: ["/opengraph-image"],
  },
  other: {
    "hreflang": "en-GB",
  },
  robots: { index: true, follow: true },
  alternates: {},
  verification: {
    google: ["crtZqqM3R8KGjNm6I63eRwiQptRqQIe6gUwj7hWHqa8", "rx1QYiLRTiCSNQDiWBi9XRJnCBbhECCy5vI3Mqam3nY"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17986058717"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-17986058717');`}
        </Script>
        {/* Facebook Pixel */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1451126946403967');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          <img height="1" width="1" style={{display:'none'}}
            src="https://www.facebook.com/tr?id=1451126946403967&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body className="antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
        <LiveChat />
        <WhatsAppButton />
      </body>
    </html>
  );
}
