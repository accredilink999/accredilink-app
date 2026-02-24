import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveChat from "@/components/LiveChat";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  metadataBase: new URL("https://carecallai.com"),
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
    title: "CareCallAI — Home Care Management Software UK",
    description:
      "All-in-one home care management software for UK domiciliary care agencies.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
        <LiveChat />
      </body>
    </html>
  );
}
